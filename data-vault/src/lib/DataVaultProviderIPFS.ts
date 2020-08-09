const RifStorage = require('@rsksmart/rif-storage')
const debug = require('debug')('rif-id:data-vault:ipfs-provider')

interface IDataVaultProviderIPFS {
  put: (did: string, content: Buffer) => Promise<string>
  get: (did: string) => Promise<string[]>
}

const DataVaultProviderIPFS = (function (
  this: IDataVaultProviderIPFS,
  ipfsOptions = { host: 'localhost', port: '8080', protocol: 'http' },
  dbOptions = {}
) {
  const storage = RifStorage.default(RifStorage.Provider.IPFS, ipfsOptions)

  /** TODO: use DB */
  const hashDictionary: any = {}

  function addToDictionary(did: string, cid: string) {
    if (!hashDictionary[did]) hashDictionary[did] = []
    hashDictionary[did].push(cid)
  }

  /**
   * Put a file in IPFS and associate it with a DID
   * @param {string} did
   * @param {Buffer} content
   * @returns string
   */
  this.put = async function(did: string, content: Buffer) {
    const fileHash = await storage.put(content)
    debug('Stored hash: ' + fileHash)

    await storage.ipfs.pin.add(fileHash)
    debug('Pinned hash: ' + fileHash)

    addToDictionary(did, fileHash)

    return fileHash
  }

  this.get = async function(did: string) {
    return hashDictionary[did] || []
  }
} as any as { new (
  ipfsOptions: { host: string, port: string, protocol: string },
  dbOptions: any
): IDataVaultProviderIPFS })

export { DataVaultProviderIPFS }
