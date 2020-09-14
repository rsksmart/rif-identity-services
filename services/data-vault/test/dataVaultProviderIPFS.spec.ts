import { createConnection } from 'typeorm'
import { Entities, CentralizedIPFSPinnerProvider, ICentralizedIPFSPinnerProvider } from '../src/lib/DataVaultProviderIPFS'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { getRandomString } from './utils'
import fs from 'fs'

jest.setTimeout(60000)

describe('DataVaultProviderIPFS tests', () => {
  let provider: ICentralizedIPFSPinnerProvider
  let did: string, anotherDid: string

  const database = `test-${new Date().getTime()}.sqlite`

  beforeAll(async () => {
    const dbConnection = await createConnection({
      type: 'sqlite',
      database,
      entities: Entities,
      synchronize: true,
      logging: false
    })

    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    const privateKey = hdKey.derive(0).privateKey!.toString('hex')
    did = rskDIDFromPrivateKey()(privateKey).did

    const anotherPrivateKey = hdKey.derive(1).privateKey!.toString('hex')
    anotherDid = rskDIDFromPrivateKey()(anotherPrivateKey).did

    // TODO: Create the IPFS daemon on runtime
    provider = new CentralizedIPFSPinnerProvider({ dbConnection, ipfsOptions: { host: 'localhost', port: '5001', protocol: 'http' } })
  })

  afterAll(() => {
    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(database, './artifacts')
    else fs.unlinkSync(database)
  })

  it('should put some content', async () => {
    const key = getRandomString()
    const value = getRandomString()

    const hash = await provider.put(did, key, Buffer.from(value))

    expect(hash).toBeTruthy()
  })

  it('should get just saved content', async () => {
    const key = getRandomString()
    const value = getRandomString()

    const hash = await provider.put(did, key, Buffer.from(value))
    const hashes = await provider.get(did, key)

    expect(hashes).toContain(hash)
  })

  it('should not get the just saved content if using another did', async () => {
    const key = getRandomString()
    const value = getRandomString()

    await provider.put(did, key, Buffer.from(value))
    const hashes = await provider.get(anotherDid, key)

    expect(hashes).toEqual([])
  })

  it('should get just saved content and not another key', async () => {
    const key = getRandomString()
    const value = getRandomString()
    const hash = await provider.put(did, key, Buffer.from(value))

    const anotherKey = getRandomString()
    const anotherValue = getRandomString()
    const anotherHash = await provider.put(did, anotherKey, Buffer.from(anotherValue))

    const hashes = await provider.get(did, key)

    expect(hashes).toContain(hash)
    expect(hashes).not.toContain(anotherHash)
  })

  it('should delete just saved content', async () => {
    const key = getRandomString()
    const value = getRandomString()

    const hash = await provider.put(did, key, Buffer.from(value))
    const deleted = await provider.delete(did, key, hash)

    expect(deleted).toBeTruthy()
  })

  it('should return false if deleting unexistent file', async () => {
    const key = getRandomString()
    const hash = getRandomString()

    const deleted = await provider.delete(did, key, hash)

    expect(deleted).toBeFalsy()
  })
})
