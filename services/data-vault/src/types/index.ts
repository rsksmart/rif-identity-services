export type RequestAuthPayload = { did: string }
export type RequestAuthResponse = { challenge: string }
export type LoginPayload = { jwt: string }
export type LoginResponse = { token: string }

export type DID = string
export type Key = string
export type ContentIdentifier = string
export type Content = string
export type CID = string

export type PutFilePayload = { key: Key, content: Content }
export type PutFileResult = { id: ContentIdentifier }
export type GetFilePayload = { key: Key, id?: ContentIdentifier }
export type GetFileResult = { id: ContentIdentifier, content: Content }
export type DeleteFilePayload = { key: Key, id?: ContentIdentifier }
export type DeleteFileResult = {}
export type SwapFilePayload = { key: Key, content: Content, id?: ContentIdentifier }
export type SwapFileResult = { id: ContentIdentifier }

export interface CentralizedDataVault {
  put(did: DID, key: Key, content: Content): Promise<ContentIdentifier>
  get(did: DID, key: Key): Promise<Content[]>
  delete(did: DID, key: Key, id?: ContentIdentifier): Promise<boolean>
  swap(did: DID, key: Key, content: Content, id?: ContentIdentifier): Promise<ContentIdentifier>
}

export interface CentralizedStorageProvider {
  put(did: DID, key: Key, content: Content): Promise<ContentIdentifier>
  get(did: DID, key: Key): Promise<Content[]>
  delete(did: DID, key: Key, id?: ContentIdentifier): Promise<boolean>
  swap(did: DID, key: Key, content: Content, id?: ContentIdentifier): Promise<ContentIdentifier>
}

export interface MetadataManager {
  save(did: DID, key: Key, id: ContentIdentifier): Promise<boolean>
  find(did: DID, key: Key): Promise<ContentIdentifier[]>
  delete(did: DID, key: Key, id: ContentIdentifier): Promise<boolean>
}

export interface IpfsClient {
  put(content: Content): Promise<CID>
  get(cid: CID): Promise<Content>
}

export interface IpfsPinner {
  pin(cid: CID): Promise<boolean>
  unpin(cid: CID): Promise<boolean>
}

// this type emulates the one exported by ipfs-http-client package. https://www.npmjs.com/package/ipfs-http-client
export type IpfsHttpClient = {
  add: (content: Buffer) => Promise<{ path: string }>,
  get: (cid: string) => Promise<Buffer>,
  pin: {
    add: (cid: string) => Promise<void>
    rm: (cid: string) => Promise<void>
  }
}
