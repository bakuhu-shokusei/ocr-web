import { RemoteServer } from './remote-server'
import { hasNoneDoneImages, getNextToDo } from './assets'
import { logger } from './logger'

const log = (s: string) => logger.info(`[Task runner] ${s}`)
const logError = (s: string) => logger.error(`[Task runner] ${s}`)

class TaskRunner {
  active: boolean

  constructor(
    private remoteServer: RemoteServer,
    private hasMoreTasks: () => boolean,
    private getNextTask: () => (remoteHost: string) => Promise<void>,
  ) {
    this.active = false
  }

  private async loop() {
    if (!this.hasMoreTasks()) {
      this.active = false
      log('no task')
      return
    }
    this.active = true
    log('has task, wait for remote server')
    const remoteHost = await this.remoteServer.waitUntilReady()
    log('remote server ready')
    const next = this.getNextTask()
    try {
      await next(remoteHost)
      log('single task done')
    } catch {
      logError('task failed, retry in 1 second')
      await new Promise((res) => setTimeout(res, 1000))
    }
    process.nextTick(() => {
      this.loop()
    })
  }

  check() {
    if (this.active) return
    this.loop()
  }
}

export const taskRunner = new TaskRunner(
  new RemoteServer(),
  hasNoneDoneImages,
  getNextToDo,
)

const INTERVAL = 1000 * 60

setInterval(() => {
  taskRunner.check()
}, INTERVAL)
