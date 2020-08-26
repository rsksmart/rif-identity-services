import request from 'supertest';
import express, { Express } from 'express'
import { setupCentralizedIPFSPinner } from '../src/services/centralizedIPFSPinner'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { verifyJWT, SimpleSigner, createJWT, decodeJWT } from 'did-jwt'
import { Resolver } from 'did-resolver';
import { getResolver } from 'ethr-did-resolver';
import { getRandomString, largeText } from './utils';
import EthrDID from 'ethr-did'

describe('Express app tests', () => {
  let app: Express, did: string, privateKey: string, resolver: Resolver;

  const env = {
    privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
    address: '0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8',
    ipfsPort: process.env.IPFS_PORT || '5001',
    ipfsHost: process.env.IPFS_HOST || 'localhost',
    authExpirationTime: '300000',
    rpcUrl: 'https://mainnet.infura.io/v3/1e0af90f0e934c88b0f0b6612146e07a',
    dbFile: `./api-test-${new Date().getTime()}.sqlite`
  }

  const login = () => request(app).post('/auth').send({ did }).expect(200)
    .then(res => res.text)
    .then(decodeJWT)
    .then(({ payload }) => payload.vc!.credentialSubject.token)

  beforeAll(async () => {
    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    privateKey = hdKey.derive(0).privateKey!.toString('hex')
    did = rskDIDFromPrivateKey()(privateKey).did;
    
    const providerConfig = {
      networks: [
        { name: "rsk:testnet", rpcUrl: env.rpcUrl, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' }
      ]
    }
    
    resolver = new Resolver(getResolver(providerConfig));

    app = express()
    
    await setupCentralizedIPFSPinner(app, env)

  })
  
  describe('POST /auth', () => {
    it('returns a valid JWT', async () => {
      const { text } = await request(app).post('/auth').send({ did }).expect(200)

      const { signer, payload, jwt } = await verifyJWT(text, { resolver })
      
      expect(signer).toBeTruthy()
      expect(payload).toBeTruthy()
      expect(jwt).toBeTruthy()
      expect(jwt.split('.').length).toBe(3)
    })
  })

  describe('GET /identity', () => {
    it('returns DVs did', async () => {
      const identity = new EthrDID({
        privateKey: env.privateKey,
        address: env.address
      })

      const { text } = await request(app).get('/identity').send().expect(200)
      
      expect(text).toEqual(identity.did)
    })
  })

  describe('POST /testAuth', () => {
    const getAuthJwt = (token: string) => {
      const sdrData = {
        issuer: did,
        claims: [{
          claimType: 'token', claimValue: token
        }],
      }

      const signer = SimpleSigner(privateKey)
      return createJWT(
        { type: 'sdr', ...sdrData },
        { signer, alg: 'ES256K-R', issuer: did },
      )
    }

    it('invalid token', async () => {
      const token = 'INVALID'
      const jwt = await getAuthJwt(token)

      const { text } = await request(app).post('/testAuth').send({ jwt }).expect(200)

      expect(text).toEqual('Not authenticated')
    })

    it('valid token', async () => {
      const token = await login()
      const jwt = await getAuthJwt(token)

      const response = await request(app).post('/testAuth').send({ jwt }).expect(200)

      expect(response.text).toEqual('Authenticated')
    })
  })

  describe('CRD operations', () => {
    const getJwt = () => login()
      .then(token => {
        const sdrData = {
          issuer: did,
          claims: [
            { claimType: 'token', claimValue: token },
            { claimType: 'content', claimValue: getRandomString() }
          ]
        }
  
        const signer = SimpleSigner(privateKey)
        return createJWT(
          { type: 'sdr', ...sdrData },
          { signer, alg: 'ES256K-R', issuer: did },
        )
      })
    
    let jwt: string, key: string;
    
    beforeEach(async () => {
      jwt = await getJwt()
      key = getRandomString()
    })

    it('POST /put', async () => {
      const { text } = await request(app).post('/put').send({ jwt, key }).expect(200)

      expect(text).toBeTruthy()
    })

    it('POST /put large text', async () => {
      await request(app).post('/put').send({ jwt: largeText }).expect(413)
    })

    it('POST /get', async () => {
      const response = await request(app).post('/put').send({ jwt, key }).expect(200)
      const expected = response.text

      const { text } = await request(app).post('/get').send({ jwt, key }).expect(200)
      expect(JSON.parse(text)).toEqual([expected])
    })

    it('POST /delete with existing key', async () => {
      const response = await request(app).post('/put').send({ jwt, key }).expect(200)
      const cid = response.text

      await request(app).post('/delete').send({ jwt, key, cid }).expect(204)

      // try to get the same key, should be empty
      const { text } = await request(app).post('/get').send({ jwt, key }).expect(200)
      expect(JSON.parse(text)).toEqual([])
    })

    it('POST /delete with non existing key', async () => {
      const response = await request(app).post('/put').send({ jwt, key }).expect(200)
      const cid = response.text

      await request(app).post('/delete').send({ jwt, key: 'NO EXISTS', cid }).expect(204)

      // try to get the same key, should be empty
      const { text } = await request(app).post('/get').send({ jwt, key }).expect(200)
      expect(JSON.parse(text)).toEqual([cid])
    })
  })
})