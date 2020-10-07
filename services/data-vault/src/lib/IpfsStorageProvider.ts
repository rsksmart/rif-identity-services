import {
  CentralizedStorageProvider, Content, ContentIdentifier, DID,
  IpfsClient, IpfsPinner, Key, MetadataManager
} from '../types'

export default class IpfsStorageProvider implements CentralizedStorageProvider {
  constructor (
    private ipfsClient: IpfsClient,
    private metadataManager: MetadataManager,
    private ipfsPinner: IpfsPinner
  ) {}

  async put (did: DID, key: Key, content: Content): Promise<ContentIdentifier> {
    const cid = await this.ipfsClient.put(content)
    await this.ipfsPinner.pin(cid)
    await this.metadataManager.save(did, key, cid)
    return cid
  }

  async get (did: DID, key: Key): Promise<Content[]> {
    return this.metadataManager.find(did, key)
    // const cids = await this.metadataManager.find(did, key)

    // leave this commented because current service returns cids instead of contents
    // TODO: Improve with Promise.all
    // const contents = []
    // for (let i = 0; i < cids.length; i++) {
    //   const cid = cids[i]
    //   contents.push(await this.ipfsClient.get(cid))
    // }

    // return contents
  }

  async delete (did: DID, key: Key, cid?: ContentIdentifier): Promise<boolean> {
    if (cid) return this.deleteByCid(did, key, cid)

    const cids = await this.metadataManager.find(did, key)

    const promises = []
    for (let i = 0; i < cids.length; i++) {
      const cid = cids[i]
      promises.push(this.deleteByCid(did, key, cid))
    }

    return Promise.all(promises).then(results => !results.includes(false))
  }

  async swap (did: DID, key: Key, content: Content, cid?: ContentIdentifier): Promise<ContentIdentifier> {
    // TODO: Should we think a way to make it some kind of transactional to prevent data inconsistencies?
    await this.delete(did, key, cid)
    return this.put(did, key, content)
  }

  private async deleteByCid (did: DID, key: Key, cid: ContentIdentifier): Promise<boolean> {
    const removed = await this.metadataManager.delete(did, key, cid)
    if (removed) return this.ipfsPinner.unpin(cid)

    return false
  }
}
