const request = require('supertest')
const express = require('express')
const convey = require('../src/convey')
const { verifyCredential } = require('did-jwt-vc')
const { rskDIDFromPrivateKey } = require('@rsksmart/rif-id-ethr-did')
const { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } = require('@rsksmart/rif-id-mnemonic')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')
const { getLoginJwt } = require('vc-jwt-auth/lib/test-utils')

const getRandomString = () => Math.random().toString(36).substring(3, 11)

const env = {
  rpcUrl: 'https://did.testnet.rsk.co:4444',
  privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
  challengeExpirationInSeconds: 300,
  authExpirationInHours: 10,
  maxRequestsPerToken: 20,
  ipfsOptions: {
    port: 5001,
    host: 'localhost',
    protocol: 'http'
  }
}

const providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: env.rpcUrl }] }
const ethrDidResolver = getResolver(providerConfig)
const didResolver = new Resolver(ethrDidResolver)

async function createClientIdentity () {
  const mnemonic = generateMnemonic(12)
  const seed = await mnemonicToSeed(mnemonic)
  const hdKey = seedToRSKHDKey(seed)
  const privateKey = hdKey.derive(0).privateKey.toString('hex')
  return rskDIDFromPrivateKey()(privateKey)
}

async function getAuthToken (clientIdentity, app) {
  const did = clientIdentity.did

  let body;

  ({ body } = await request(app).post('/request-auth').send({ did }).expect(200))

  const jwt = await getLoginJwt('challenge', body.challenge, clientIdentity);

  ({ body } = await request(app).post('/auth').send({ jwt }).expect(200));

  return body.token
}

describe('Express app tests', () => {
  let app, clientIdentity

  beforeAll(() => {
    app = express()

    convey(app, env)
  })

  beforeEach(async () => {
    clientIdentity = await createClientIdentity()
  })

  describe('auth', () => {
    it('returns a challenge when requesting it', async () => {
      const did = clientIdentity.did

      const { body } = await request(app).post('/request-auth').send({ did }).expect(200)

      expect(body.challenge).toBeTruthy()
    })

    it('returns a 500 if not did present', async () => {
      await request(app).post('/request-auth').send().expect(500)
    })

    it('returns a valid token if sending the proper challenge', async () => {
      const token = await getAuthToken(clientIdentity, app)

      const { issuer, payload } = await verifyCredential(token, didResolver)
      const expectedIssuerDid = rskDIDFromPrivateKey()(env.privateKey).did

      expect(payload.sub).toEqual(clientIdentity.did)
      expect(payload.exp).toBeLessThan((Date.now() / 1000) + env.authExpirationInHours * 60 * 60 + 10) // added 10 seconds of grace
      expect(issuer).toContain(expectedIssuerDid)
    })

    it('return 401 if not requested the challenge before', async () => {
      const jwt = await getLoginJwt('another', 'invalid', clientIdentity)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Request for a challenge before auth')
    })

    it('return 401 if invalid challenge', async () => {
      // request for challenge so it bypasses that validation, will not be used
      await request(app).post('/request-auth').send({ did: clientIdentity.did }).expect(200)

      const jwt = await getLoginJwt('challenge', 'invalid', clientIdentity)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Invalid challenge')
    })

    it('return 401 if invalid claim type', async () => {
      // request for challenge so it bypasses that validation, will not be used
      await request(app).post('/request-auth').send({ did: clientIdentity.did }).expect(200)

      const jwt = await getLoginJwt('another', 'invalid', clientIdentity)

      const { text } = await request(app).post('/auth').send({ jwt }).expect(401)

      expect(text).toEqual('Invalid payload, missing challenge claim')
    })
  })

  describe('authenticated requests', () => {
    let token

    beforeEach(async () => {
      token = await getAuthToken(clientIdentity, app)
    })

    it('returns a valid cid', async () => {
      const file = getRandomString()

      const { body } = await request(app)
        .post('/file')
        .set('Authorization', token)
        .send({ file }).expect(200)

      const { cid, url } = body

      expect(cid).toBeTruthy() // TODO: calculate cid
      expect(url).toBeTruthy()
      expect(url).toContain('convey://')
    })

    it('returns a 401 if not logged in when posting a content', async () => {
      const file = 'theContent'

      await request(app).post('/file').send({ file }).expect(401)
    })

    it('fails when posting undefined', async () => {
      const file = undefined

      await request(app)
        .post('/file')
        .set('Authorization', token)
        .send({ file }).expect(500)
    })

    it('gets a saved cid', async () => {
      const expected = getRandomString()

      const response = await request(app)
        .post('/file').set('Authorization', token)
        .send({ file: expected }).expect(200)

      const { cid } = response.body

      const { body } = await request(app)
        .get(`/file/${cid}`).set('Authorization', token).expect(200)

      const { file } = body

      expect(file).toEqual(expected)
    })

    it('not found when getting undefined', async () => {
      await request(app).get('/file').set('Authorization', token).send().expect(404)
    })

    it('returns a 401 if not logged in when getting a content', async () => {
      await request(app).get('/file/notExists').send().expect(401)
    })

    it('not found a cid that has not been saved in this convey', async () => {
      const cid = 'notExists'

      await request(app).get(`/file/${cid}`).set('Authorization', token).expect(404)
    })
  })

  it('status check answers ok', async () => {
    await request(app).get('/__health').expect(204)
  })
})

describe('Express app tests - wrong env', () => {
  it('returns a 500 error when invalid ipfs api', async () => {
    const app = express()

    convey(app, {
      ...env,
      ipfsOptions: {
        port: '5001',
        host: 'NOT-EXISTS',
        protocol: 'http'
      }
    })

    const clientIdentity = await createClientIdentity()
    const token = await getAuthToken(clientIdentity, app)

    const file = getRandomString()
    await request(app).post('/file').set('Authorization', token).send({ file }).expect(500)
  })

  it('throws an error when no private key provided', async () => {
    const invalidEnv = { ...env }
    delete env.privateKey

    const app = express()

    try {
      convey(app, invalidEnv)
    } catch (err) {
      expect(err.message).toEqual('Missing privateKey')
    }
  })
})
