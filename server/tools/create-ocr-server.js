const VultrNode = require('@vultr/vultr-node')

const apiKey = 'PECVK4F4OROFEE4ZEL4PNZRR2S66HHILMWVA'
const vultr = VultrNode.initialize({
  apiKey,
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

;(async () => {
  const ocrServer = await vultr.instances.createInstance({
    region: 'nrt',
    // plan: 'vcg-a16-2c-8g-2vram',
    plan: 'vcg-a16-2c-16g-4vram',
    backups: 'disabled',
    os_id: '2284', // Ubuntu 24.04 LTS x64
    user_data: Buffer.from(cloudInit).toString('base64'),
    script_id: '54c0a87b-5333-4e4b-93a0-dee3393e988b', // mount storage
    sshkey_id: ['803258b2-ef33-4243-90b7-321e1972b027'],
  })
  const { id: ocrInstanceId } = ocrServer.instance

})()
