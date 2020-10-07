import { CentralizedDataVault, CentralizedStorageProvider, Content, ContentIdentifier, DID, Key } from '../types'

export default class implements CentralizedDataVault {
  // eslint-disable-next-line no-useless-constructor
  constructor (private provider: CentralizedStorageProvider) {}

  put (did: DID, key: Key, content: Content): Promise<ContentIdentifier> {
    return this.provider.put(did, key, content)
  }

  get (did: DID, key: Key): Promise<Content[]> {
    return this.provider.get(did, key)
  }

  delete (did: DID, key: Key, id?: string): Promise<boolean> {
    return this.provider.delete(did, key, id)
  }

  swap (did: DID, key: Key, content: Content, id?: ContentIdentifier): Promise<string> {
    return this.provider.swap(did, key, content, id)
  }
}
