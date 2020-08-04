const RifStorage = require('@rsksmart/rif-storage')
const debug = require('debug')('rif-id:data-vault:ipfs-provider')

const DataVaultProviderIPFS = (function (
  ipfsOptions = { host: 'localhost', port: '8080', protocol: 'http' },
  dbOptions = {}
) {
  const storage = RifStorage.default(RifStorage.Provider.IPFS, ipfsOptions)

  /** TODO: use DB */
  const hashDictionary = {}

  function addToDictionary(did, hash) {
    if (!hashDictionary[did]) hashDictionary[did] = []
    hashDictionary[did].push(hash)
  }

  /**
   * Put a file in IPFS and associate it with a DID
   * @param {string} did
   * @param {Buffer} content
   * @returns string
   */
  this.put = async function(did, content) {
    const fileHash = await storage.put(content)
    debug('Stored hash: ' + fileHash)

    await storage.ipfs.pin.add(fileHash)
    debug('Pinned hash: ' + fileHash)

    addToDictionary(did, fileHash)

    return fileHash
  }

  this.get = async function(did) {
    return hashDictionary[did] || []
  }
})

module.exports = { DataVaultProviderIPFS }
