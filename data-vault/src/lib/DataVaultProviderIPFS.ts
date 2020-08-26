import RifStorage, { Provider } from '@rsksmart/rif-storage'
import { Entity, PrimaryGeneratedColumn, Column, Connection } from 'typeorm'
import logger from './logger'

interface IDataVaultProviderIPFS {
  put: (did: string, key: string, content: Buffer) => Promise<string>
  get: (did: string, key: string) => Promise<string[]>
  delete: (did: string, key: string, cid: string) => Promise<boolean>
}

@Entity()
class DataVaultEntry {
  constructor(did: string, key: string, cid: string) {
    this.did = did
    this.key = key
    this.cid = cid
  }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  did!: string;

  @Column('text')
  key!: string;

  @Column('text')
  cid!: string;
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
    logger.info(`pair ${key} - ${value} stored for DID: ${did}`)
  }

  /**
   * Put a file in IPFS and associate it with a DID
   * @param {string} did
   * @param {Buffer} content
   * @returns string
   */
  this.put = async function(did: string, key: string, value: Buffer) {
    const fileHash = await storage.put(value)
    logger.info('Stored hash: ' + fileHash)

    await (storage as any).ipfs.pin.add(fileHash)
    logger.info('Pinned hash: ' + fileHash)

    await addToDictionary(did, key, fileHash)

    return fileHash
  }

  this.get = function(did: string, key: string): Promise<string[]> {
    return dbConnection.getRepository(DataVaultEntry).find({
      where: { did, key },
      select: ['cid']
    }).then(entries => entries.map(entry => entry.cid))
  }

  this.delete = async function(did: string, key: string, cid: string): Promise<boolean> {
    const repository = dbConnection.getRepository(DataVaultEntry)
    const file = await repository.findOne({ where: { did, key, cid } });

    if (file) {
      const deleteResult =  await repository.remove(file)
      logger.info(`Deleted hash: ${cid}`)

      if (!deleteResult.id) {
        await (storage as any).ipfs.pin.rm(cid)
        logger.info(`Unpinned hash: ${cid}`)

        return true
      }
    }

    return false
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
