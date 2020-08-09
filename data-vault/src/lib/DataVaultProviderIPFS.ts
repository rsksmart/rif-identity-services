import RifStorage, { Provider } from '@rsksmart/rif-storage'
import Debug from 'debug'
import { Entity, PrimaryGeneratedColumn, Column, Connection } from 'typeorm'

const debug = Debug('rif-id:data-vault:ipfs-provider')

interface IDataVaultProviderIPFS {
  put: (did: string, content: Buffer) => Promise<string>
  get: (did: string) => Promise<string[]>
}

@Entity()
class DataVaultEntry {
  constructor(did: string, cid: string) {
    this.did = did
    this.cid = cid
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  cid!: string;
}

const DataVaultProviderIPFS = (function (
  this: IDataVaultProviderIPFS,
  dbConnection: Connection,
  ipfsOptions = { host: 'localhost', port: '8080', protocol: 'http' },
) {
  const storage = RifStorage(Provider.IPFS, ipfsOptions)

  async function addToDictionary(did: string, cid: string) {
    const entry = new DataVaultEntry(did, cid)
    await dbConnection.manager.save(entry)
    debug(`pair ${did} - ${cid} stored`)
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

    await (storage as any).ipfs.pin.add(fileHash)
    debug('Pinned hash: ' + fileHash)

    await addToDictionary(did, fileHash)

    return fileHash
  }

  this.get = function(did: string): Promise<string[]> {
    return dbConnection.getRepository(DataVaultEntry).find({
      where: { did },
      select: ['cid']
    }).then(entries => entries.map(entry => entry.cid))
  }
} as any as { new (
  dbOptions: Connection,
  ipfsOptions: { host: string, port: string, protocol: string }
): IDataVaultProviderIPFS })

const Entities = [DataVaultEntry]

export { DataVaultProviderIPFS, Entities }
