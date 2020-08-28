import RIFStorage, { Provider } from '@rsksmart/rif-storage'
import { Entity, PrimaryGeneratedColumn, Column, Connection } from 'typeorm'
import createLogger from './logger'

const logger = createLogger('rif-id:data-vault:ipfs-provider')

@Entity()
class DataVaultEntry {
  constructor (did: string, key: string, cid: string) {
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

type IPFSPinner = { ipfs: { pin: {
  add: (cid: string) => Promise<void>
  rm: (cid: string) => Promise<void>
} } }

type CentralizedIPFSPinnerProviderConfig = {
  dbConnection: Connection,
  ipfsOptions?: { host: string, port: string, protocol: string },
}

export interface ICentralizedIPFSPinnerProvider {
  put: (did: string, key: string, content: Buffer) => Promise<string>
  get: (did: string, key: string) => Promise<string[]>
  delete: (did: string, key: string, cid: string) => Promise<boolean>
}

export const CentralizedIPFSPinnerProvider = (function (this: ICentralizedIPFSPinnerProvider, {
  dbConnection,
  ipfsOptions
}: CentralizedIPFSPinnerProviderConfig) {
  const storage = RIFStorage(Provider.IPFS, ipfsOptions || { host: 'localhost', port: '8080', protocol: 'http' })

  /**
   * Put a file in IPFS and associate it with a DID
   * @param {string} did
   * @param {Buffer} content
   * @returns string
   */
  this.put = async function (did: string, key: string, content: Buffer) {
    const fileHash = await storage.put(content)
    logger.info('Stored hash: ' + fileHash)

    await (storage as IPFSPinner).ipfs.pin.add(fileHash)
    logger.info('Pinned hash: ' + fileHash)

    const entry = new DataVaultEntry(did, key, fileHash)
    await dbConnection.manager.save(entry)
    logger.info(`pair ${key} - ${content} stored for DID: ${did}`)

    return fileHash
  }

  this.get = function (did: string, key: string): Promise<string[]> {
    return dbConnection.getRepository(DataVaultEntry).find({
      where: { did, key },
      select: ['cid']
    }).then((entries: { cid: string }[]) => entries.map(entry => entry.cid))
  }

  this.delete = async function (did: string, key: string, cid: string): Promise<boolean> {
    const repository = dbConnection.getRepository(DataVaultEntry)
    const file = await repository.findOne({ where: { did, key, cid } })

    if (file) {
      const deleteResult = await repository.remove(file)
      logger.info(`Deleted hash: ${cid}`)

      if (!deleteResult.id) {
        await (storage as IPFSPinner).ipfs.pin.rm(cid)
        logger.info(`Unpinned hash: ${cid}`)

        return true
      }
    }

    return false
  }
} as any as { new(config: CentralizedIPFSPinnerProviderConfig): ICentralizedIPFSPinnerProvider })

export const Entities = [DataVaultEntry]
