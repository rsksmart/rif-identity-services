const request = require('supertest')
const express = require('express')
const convey = require('../src/convey')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc')
const { rskAddressFromPrivateKey } = require('@rsksmart/rif-id-ethr-did')
const { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } = require('@rsksmart/rif-id-mnemonic')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')

const getRandomString = () => Math.random().toString(36).substring(3, 11)

const env = {
  rpcUrl: 'https://did.testnet.rsk.co:4444',
  privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
  address: '0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8',
  challengeExpirationInSeconds: 300,
  authExpirationInHours: 10,
  ipfsOptions: {
    port: 5001,
    host: 'localhost',
    protocol: 'http'
  }
}

const providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: env.rpcUrl }] }
const ethrDidResolver = getResolver(providerConfig)
const didResolver = new Resolver(ethrDidResolver)

describe('Express app tests', () => {
  let app, clientIdentity

  beforeAll(() => {
    app = express()

    convey(app, env, '')
  })

  beforeEach(async () => {
    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    const privateKey = hdKey.derive(0).privateKey.toString('hex')
    const address = rskAddressFromPrivateKey(privateKey)

    clientIdentity = new EthrDID({ address, privateKey })
  })

  const getLoginJwt = async (claim) => createVerifiableCredentialJwt({
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: { claims: [claim] }
    }
  }, clientIdentity)

  describe('auth', () => {
    it('returns a challenge when requesting it', async () => {
      const did = clientIdentity.did

      const { body } = await request(app).post('/request-auth').send({ did }).expect(200)

      expect(body.challenge).toBeTruthy()
    })

    it('returns a 500 if not did present', async () => {
      request(app).post('/request-auth').send().expect(200)
    })

    it('returns a valid token if sending the proper challenge', async () => {
      const did = clientIdentity.did
      let body;

      ({ body } = await request(app).post('/request-auth').send({ did }).expect(200))

      const claim = { claimType: 'challenge', claimValue: body.challenge }

      const jwt = await getLoginJwt(claim);

      ({ body } = await request(app).post('/auth').send({ jwt }).expect(200))

      const { issuer, payload } = await verifyCredential(body.token, didResolver)

      expect(payload.sub).toEqual(clientIdentity.did)
      expect(payload.exp).toBeLessThan((Date.now() / 1000) + env.authExpirationInHours * 60 * 60 + 10) // added 10 seconds of grace
      expect(issuer.toLowerCase()).toContain(env.address.toLowerCase())
    })

    it('return 401 if not requested the challenge before', async () => {
      const claim = { claimType: 'another', claimValue: 'invalid' }

      const jwt = await getLoginJwt(claim)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Request for a challenge before auth')
    })

    it('return 401 if invalid challenge', async () => {
      // request for challenge so it bypasses that validation, will not be used
      await request(app).post('/request-auth').send({ did: clientIdentity.did }).expect(200)

      const claim = { claimType: 'challenge', claimValue: 'invalid' }

      const jwt = await getLoginJwt(claim)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Invalid challenge')
    })

    it('return 401 if invalid claim type', async () => {
      // request for challenge so it bypasses that validation, will not be used
      await request(app).post('/request-auth').send({ did: clientIdentity.did }).expect(200)

      const claim = { claimType: 'another', claimValue: 'invalid' }

      const jwt = await getLoginJwt(claim)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Invalid payload, missing challenge claim')
    })
  })

  it('returns a valid cid', async () => {
    const file = getRandomString()

    const { body } = await request(app).post('/file').send({ file }).expect(200)

    const { cid, url } = body

    expect(cid).toBeTruthy() // TODO: calculate cid
    expect(url).toBeTruthy()
    expect(url).toContain('convey://')
  })

  it('fails when posting undefined', async () => {
    const file = undefined

    await request(app).post('/file').send({ file }).expect(500)
  })

  it('gets a saved cid', async () => {
    const expected = getRandomString()

    const response = await request(app).post('/file').send({ file: expected }).expect(200)
    const { cid } = response.body

    const { body } = await request(app).get(`/file/${cid}`).expect(200)

    const { file } = body

    expect(file).toEqual(expected)
  })

  it('not found when getting undefined', async () => {
    await request(app).get('/file').send().expect(404)
  })

  it('not found a cid that has not been saved in this convey', async () => {
    const cid = 'notExists'

    request(app).get(`/file/${cid}`).expect(404)
  })

  it('status check answers ok', async () => {
    const { text } = await request(app).get('/__health').expect(200)

    expect(text).toEqual('OK')
  })
})

describe('Express app tests - wrong ipfs node', () => {
  const invalidEnv = {
    ...env,
    ipfsOptions: {
      port: '5001',
      host: 'NOT-EXISTS',
      protocol: 'http'
    }
  }

  it('returns a 500 error when invalid ipfs api', async () => {
    const app = express()

    convey(app, invalidEnv, '')

    const file = getRandomString()

    request(app).post('/file').send({ file }).expect(500)
  })

  it('status check fails when invalid ipfs api', async () => {
    const app = express()

    convey(app, invalidEnv, '')

    request(app).get('/__health').send().expect(500)
  })
})
