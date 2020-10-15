import request from 'supertest'
import express, { Express } from 'express'
import { setupCentralizedIPFSPinner, DAFClaim } from '../src/services/centralizedIPFSPinner'
import { rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { verifyJWT, SimpleSigner, createJWT, decodeJWT } from 'did-jwt'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { getRandomString, largeText, mockedLogger } from './utils'
import EthrDID from '@rsksmart/ethr-did'
import fs from 'fs'

// this test suite is failing
describe('Express app tests', () => {
  let app: Express, did: string, privateKey: string, resolver: Resolver

  const dbFile = `./api-test-${new Date().getTime()}.sqlite`

  const env = {
    privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
    address: '0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8',
    ipfsPort: '5001',
    ipfsHost: 'localhost',
    authExpirationTime: '300000',
    rpcUrl: 'https://did.testnet.rsk.co:4444',
    networkName: 'rsk:testnet',
    dbFile
  }

  const login = () => request(app).post('/auth').send({ did }).expect(200)
    .then(res => res.text)
    .then(decodeJWT)
    .then(({ payload }) => {
      if (!payload.vc) throw new Error('Invalid JWT')
      return payload.vc.credentialSubject.token
    })

  beforeAll(async () => {
    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    privateKey = hdKey.derive(0).privateKey!.toString('hex')
    did = rskTestnetDIDFromPrivateKey()(privateKey).did

    const providerConfig = {
      networks: [
        { name: 'rsk:testnet', rpcUrl: env.rpcUrl, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' }
      ]
    }

    resolver = new Resolver(getResolver(providerConfig))

    app = express()

    await setupCentralizedIPFSPinner(app, env, mockedLogger)
  })

  afterAll(() => {
    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(dbFile, './artifacts')
    else fs.unlinkSync(dbFile)
  })

  describe('POST /auth', () => {
    it('returns a valid JWT', async () => {
      const { text } = await request(app).post('/auth').send({ did }).expect(200)

      const { signer, payload, jwt } = await verifyJWT(text, { resolver })

      expect(signer).toBeTruthy()
      expect(payload).toBeTruthy()
      expect(jwt).toBeTruthy()
      expect(jwt.split('.')).toHaveLength(3)
    })
  })

  describe('GET /identity', () => {
    it('returns DVs did', async () => {
      const identity = new EthrDID({
        privateKey: env.privateKey,
        address: env.address,
        method: 'ethr:rsk:testnet'
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
        }]
      }

      const signer = SimpleSigner(privateKey)
      return createJWT(
        { type: 'sdr', ...sdrData },
        { signer, alg: 'ES256K-R', issuer: did }
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
    const getJwt = (otherClaims: DAFClaim[]) => login()
      .then(token => {
        const sdrData = {
          issuer: did,
          claims: [
            { claimType: 'token', claimValue: token },
            ...otherClaims
          ]
        }

        const signer = SimpleSigner(privateKey)
        return createJWT(
          { type: 'sdr', ...sdrData },
          { signer, alg: 'ES256K-R', issuer: did }
        )
      })

    const putRandom = () => {
      const key = getRandomString()

      return getJwt([
        { claimType: 'key', claimValue: key },
        { claimType: 'content', claimValue: getRandomString() }
      ]).then(jwt => {
        return request(app).post('/put').send({ jwt }).expect(200)
          .then(res => ({ key, cid: res.text }))
      })
    }

    it('POST /put', async () => {
      const { cid } = await putRandom()

      expect(cid).toBeTruthy()
      // TODO: test is expected CID using hashing function
    })

    it('POST /put large text', async () => {
      await request(app).post('/put').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: getRandomString() },
          { claimType: 'content', claimValue: largeText }
        ])
      }).expect(413)
    })

    it('POST /get', async () => {
      const { key, cid } = await putRandom()

      const { text } = await request(app).post('/get').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: key }
        ])
      }).expect(200)
      expect(JSON.parse(text)).toEqual([cid])
    })

    it('POST /delete with existing key', async () => {
      const { key, cid } = await putRandom()

      await request(app).post('/delete').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: key },
          { claimType: 'cid', claimValue: cid }
        ])
      }).expect(204)

      // try to get the same key, should be empty
      const { text } = await request(app).post('/get').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: key }
        ])
      }).expect(200)

      expect(JSON.parse(text)).toEqual([])
    })

    it('POST /delete with non existing key', async () => {
      const { key, cid } = await putRandom()

      await request(app).post('/delete').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: 'NO EXISTS' },
          { claimType: 'cid', claimValue: cid }
        ])
      }).expect(204)

      // try to get the same key, should be set
      const { text } = await request(app).post('/get').send({
        jwt: await getJwt([
          { claimType: 'key', claimValue: key }
        ])
      }).expect(200)

      expect(JSON.parse(text)).toEqual([cid])
    })
  })
})
