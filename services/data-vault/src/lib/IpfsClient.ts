import { Content, ContentIdentifier, IpfsClient, IpfsHttpClient } from '../types'

export default class implements IpfsClient {
  constructor (private ipfsHttpClient: IpfsHttpClient) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get (cid: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  put (content: Content): Promise<ContentIdentifier> {
    const buffer = Buffer.from(content)
    return this.ipfsHttpClient.add(buffer).then(({ path }) => path)
  }
}
