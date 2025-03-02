const VultrNode = require('@vultr/vultr-node')
const fetch = require('node-fetch')

const apiKey = ''
const vultr = VultrNode.initialize({
  apiKey,
})

const cloudInit = ``

;(async () => {
  // const r = await vultr.instances.createInstance({
  //   region: 'nrt',
  //   plan: 'vc2-1c-1gb',
  //   backups: 'disabled',
  //   user_data: Buffer.from(cloudInit).toString('base64'),
  //   image_id: 'docker', // Docker on Ubuntu 24.04
  // })

  // const r = await vultr.blockStorage.listStorages()

  // const r = await vultr.blockStorage.attachStorage({
  //   'block-id': 'cdf599c8-96a0-48d0-a42e-9269e0234ea8',
  //   instance_id: vps_id,
  //   live: true,
  // })

  const r = await vultr.blockStorage.listStorages()

  // list vfs
  // const r = await (
  //   await fetch('https://api.vultr.com/v2/vfs', {
  //     headers: {
  //       Authorization: `Bearer ${apiKey}`,
  //     },
  //   })
  // ).json()

  console.log(r)
})()
