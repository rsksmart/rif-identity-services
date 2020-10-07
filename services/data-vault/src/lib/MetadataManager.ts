import { Repository } from 'typeorm'
import { ContentIdentifier, MetadataManager, DID, Key } from '../types'
import { IpfsSavedContent } from './entities'

export default class implements MetadataManager {
  constructor (private repository: Repository<IpfsSavedContent>) {}

  save (did: DID, key: Key, cid: ContentIdentifier): Promise<boolean> {
    const entry = new IpfsSavedContent(did, key, cid)

    return this.repository.save(entry).then(() => true)
  }

  find (did: DID, key: Key): Promise<ContentIdentifier[]> {
    return this.repository.find({
      where: { did, key },
      select: ['cid']
    }).then((entries: { cid: string }[]) => entries.map(entry => entry.cid))
  }

  async delete (did: string, key: Key, cid: ContentIdentifier): Promise<boolean> {
    const file = await this.repository.findOne({ where: { did, key, cid } })

    if (file) {
      const deleteResult = await this.repository.remove(file)

      if (!deleteResult.id) return true
    }

    return false
  }
}
