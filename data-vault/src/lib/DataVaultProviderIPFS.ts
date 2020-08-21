import RifStorage, { Provider } from '@rsksmart/rif-storage'
import Debug from 'debug'
import { Entity, PrimaryGeneratedColumn, Column, Connection } from 'typeorm'

const debug = Debug('rif-id:data-vault:ipfs-provider')

interface IDataVaultProviderIPFS {
  put: (did: string, key: string, content: Buffer) => Promise<string>
  get: (did: string, key: string) => Promise<string[]>
}

@Entity()
class DataVaultEntry {
  constructor(did: string, key: string, value: string) {
    this.did = did
    this.key = key
    this.value = value
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  key!: string;

  @Column('text')
  value!: string;
}

const DataVaultProviderIPFS = (function (
  this: IDataVaultProviderIPFS,
  dbConnection: Connection,
  ipfsOptions: IPFSOptions = { host: 'localhost', port: '8080', protocol: 'http' },
) {
  const storage = RifStorage(Provider.IPFS, ipfsOptions)

  async function addToDictionary(did: string, key: string, value: string) {
    const entry = new DataVaultEntry(did, key, value)
    await dbConnection.manager.save(entry)
    debug(`pair ${key} - ${value} stored for DID: ${did}`)
  }

  /**
   * Put a file in IPFS and associate it with a DID
   * @param {string} did
   * @param {Buffer} content
   * @returns string
   */
  this.put = async function(did: string, key: string, value: Buffer) {
    const fileHash = await storage.put(value)
    debug('Stored hash: ' + fileHash)

    await (storage as any).ipfs.pin.add(fileHash)
    debug('Pinned hash: ' + fileHash)

    await addToDictionary(did, key, fileHash)

    return fileHash
  }

  this.get = function(did: string, key: string): Promise<string[]> {
    return dbConnection.getRepository(DataVaultEntry).find({
      where: { did, key },
      select: ['value']
    }).then(entries => entries.map(entry => entry.value))
  }
} as any as { new (
  dbOptions: Connection,
  ipfsOptions: { host: string, port: string, protocol: string }
): IDataVaultProviderIPFS })

const Entities = [DataVaultEntry]

interface IPFSOptions {
  host: string;
  port: string;
  protocol: string;
}

export { DataVaultProviderIPFS, Entities, IPFSOptions }
