import { Repository } from 'typeorm'
import { IpfsPinner, IpfsHttpClient } from '../types'
import { IpfsPinnedCid } from './entities'

export default class implements IpfsPinner {
  constructor (
    private ipfsHttpClient: IpfsHttpClient,
    private repository: Repository<IpfsPinnedCid>
  ) {}

  pin (cid: string): Promise<boolean> {
    return this.ipfsHttpClient.pin.add(cid)
      .then(() => this.repository.save(new IpfsPinnedCid(cid)))
      .then(() => true)
  }

  unpin (cid: string): Promise<boolean> {
    return this.ipfsHttpClient.pin.rm(cid)
      .then(() => this.repository.delete({ cid }))
      .then(() => true)
  }
}
