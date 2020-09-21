import request from 'supertest'
import express, { Express } from 'express'
import { setupCentralizedIPFSPinner, DAFClaim } from '../src/services/centralizedIPFSPinner'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { verifyJWT, SimpleSigner, createJWT, decodeJWT } from 'did-jwt'
import { Resolver } from 'did-resolver'
import { getResolver } from 'ethr-did-resolver'
import { getRandomString, largeText } from './utils'
import EthrDID from 'ethr-did'
import fs from 'fs'

jest.setTimeout(60000)

describe('Express app tests', () => {
  let app: Express, did: string, privateKey: string, resolver: Resolver

  const dbFile = `./api-test-${new Date().getTime()}.sqlite`

  const env = {
    privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
    address: '0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8',
    ipfsPort: '5001',
    ipfsHost: 'localhost',
    authExpirationTime: '300000',
    rpcUrl: 'https://mainnet.infura.io/v3/1e0af90f0e934c88b0f0b6612146e07a',
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
    did = rskDIDFromPrivateKey()(env.privateKey).did

    const providerConfig = {
      networks: [
        { name: 'rsk:testnet', rpcUrl: env.rpcUrl, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' }
      ]
    }

    resolver = new Resolver(getResolver(providerConfig))

    app = express()

    await setupCentralizedIPFSPinner(app, env)
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
        address: env.address
      })

      const { text } = await request(app).get('/identity').send().expect(200)

      expect(text).toEqual(identity.did)
    })
  })

  describe('POST /testAuth', () => {
    const getAuthJwt = (token: string, otherPrivateKey?: string) => {
      const sdrData = {
        issuer: did,
        claims: [{
          claimType: 'token', claimValue: token
        }]
      }

      const signer = SimpleSigner(otherPrivateKey || env.privateKey)
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

    it('empty jwt', async () => {
      const { text } = await request(app).post('/testAuth').send({ jwt: '' }).expect(200)

      expect(text).toEqual('Not authenticated')
    })

    it('invalid signer', async () => {
      const token = await login()
      const jwt = await getAuthJwt(token, '0c9c4d12e23f7f070dfacee7f870d9b79866f6754ed506968e16c5e09e68b63b')

      const { text } = await request(app).post('/testAuth').send({ jwt }).expect(200)

      expect(text).toEqual('Not authenticated')
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

        const signer = SimpleSigner(env.privateKey)
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
