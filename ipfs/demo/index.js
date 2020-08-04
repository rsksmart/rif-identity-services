const RifStorage = require('@rsksmart/rif-storage')

async function main() {
  const storage = RifStorage.default(RifStorage.Provider.IPFS, { host: 'localhost', port: '5001', protocol: 'http' })

  const fileHash = await storage.put(Buffer.from('hello world!'))
  console.log('hash: ' + fileHash)

  const retrievedData = await storage.get(fileHash)
  console.log('content: ' + retrievedData.toString())

  await storage.ipfs.pin.add(fileHash)

  const pins = await storage.ipfs.pin.ls()
  console.log('pins: ')
  console.log(pins)
  console.log('hash in list: ')
  console.log(pins.find(pin => pin.hash === fileHash))

  //await storage.ipfs.pin.rm(fileHash)
}

main().catch(e => { console.error(e); process.exit(1); })
