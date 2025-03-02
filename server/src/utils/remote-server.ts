import VultrNode from '@vultr/vultr-node'
import { API_KEY } from '../env'
import { logger } from './logger'

const log = (s: string) => logger.info(`[Remote server] ${s}`)
const logError = (s: string) => logger.error(`[Remote server] ${s}`)

const vultr = VultrNode.initialize({
  apiKey: API_KEY,
})

const cloudInit = `
#cloud-config

apt:
  sources:
    docker.list:
      source: deb [arch=amd64] https://download.docker.com/linux/ubuntu $RELEASE stable
      keyid: 9DC858229FC7DD38854AE2D88D81803C0EBFCD88

packages:
  - docker-ce
  - docker-ce-cli
`

const LABEL = 'ocr server'
interface VultrInstance {
  id: string
  main_ip: string
  status: string
  server_status: string
  label: string
}
async function createInstance(): Promise<VultrInstance | null> {
  try {
    const ocrServer = await vultr.instances.createInstance({
      region: 'nrt',
      plan: 'vcg-a16-2c-16g-4vram',
      backups: 'disabled',
      os_id: '2284', // Ubuntu 24.04 LTS x64
      user_data: Buffer.from(cloudInit).toString('base64'),
      script_id: '54c0a87b-5333-4e4b-93a0-dee3393e988b', // mount storage
      sshkey_id: ['803258b2-ef33-4243-90b7-321e1972b027'],
      label: LABEL,
    })
    return ocrServer.instance as VultrInstance
  } catch {
    return null
  }
}
async function deleteInstance(id: string) {
  await vultr.instances.deleteInstance({ 'instance-id': id })
}
async function getInstance(retry: number): Promise<VultrInstance | null> {
  try {
    const result = await vultr.instances.listInstances({
      label: LABEL,
      region: 'nrt',
    })
    const instances = result.instances as VultrInstance[]
    if (instances.length === 0) return null
    return instances[0]
  } catch {
    if (retry > 0) {
      return await getInstance(retry - 1)
    } else {
      return null
    }
  }
}

enum Status {
  NotExist = 'not-exist',
  Starting = 'starting',
  Ready = 'ready',
  Failed = 'failed',
}

async function getCurrentStatus(): Promise<{
  status: Status
  instance?: VultrInstance
}> {
  const activeInstance = await getInstance(2)
  if (!activeInstance) return { status: Status.NotExist }
  try {
    const healthCheckResult = await (
      await fetch(`http://${activeInstance.main_ip}:3000/health-check`)
    ).text()
    if (healthCheckResult.includes('OK')) {
      return { status: Status.Ready, instance: activeInstance }
    }
  } catch {
    return { status: Status.Starting, instance: activeInstance }
  }
  return { status: Status.Starting, instance: activeInstance }
}

export class RemoteServer {
  status: Status
  activeInstance: VultrInstance | null
  timer: null | ReturnType<typeof setTimeout>

  constructor() {
    this.status = Status.NotExist
    this.activeInstance = null
    this.updateStatus()
    this.timer = null
  }

  private async updateStatus() {
    if (this.status === Status.Failed) return
    const { status, instance } = await getCurrentStatus()
    this.status = status
    if (instance) {
      this.activeInstance = instance
    }
    if (this.status === Status.Ready) {
      this.startCountDown()
    }
  }

  private async createNewInstance() {
    log('create new instance')
    const instance = await createInstance()
    if (!instance) {
      logError('vultr instance created failed')
      this.status = Status.Failed
      return
    }
    log(`instance created ${instance.id}`)
    this.activeInstance = instance
  }

  private startCountDown() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(
      async () => {
        log('try to delete instance')
        await deleteInstance(this.activeInstance!.id)
        log('instance deleted')
      },
      1000 * 60 * 30,
    )
  }

  async waitUntilReady(): Promise<string> {
    await this.updateStatus()
    if (this.status === Status.Failed) {
      logError('create remote server failed')
      throw 'create remote server failed'
    }
    if (this.status === Status.Ready) {
      this.startCountDown()
      return this.activeInstance!.main_ip
    }
    if (this.status === Status.NotExist) {
      await this.createNewInstance()
      if (this.status === Status.Failed) {
        throw 'Vultr instance create failed'
      }
    }

    // polling for 20 minutes
    const startTime = Date.now()
    try {
      await new Promise<void>((resolve, reject) => {
        let timer = setInterval(async () => {
          const timeNow = Date.now()
          if (timeNow - startTime > 1000 * 60 * 20) {
            clearInterval(timer)
            reject()
            return
          }

          await this.updateStatus()
          log(`polling result: ${this.status}`)
          if (this.status === Status.Ready) {
            resolve()
            clearInterval(timer)
          }
        }, 1000 * 20)
      })
    } catch {
      logError('not ready after 20 minutes')
      this.status = Status.Failed
    }

    this.startCountDown()

    return this.activeInstance!.main_ip
  }
}
