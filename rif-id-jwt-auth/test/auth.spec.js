const { rskDIDFromPrivateKey } = require('@rsksmart/rif-id-ethr-did')
const { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } = require('@rsksmart/rif-id-mnemonic')
const { authExpressMiddleware, getChallenge, getAuthToken, initializeAuth } = require('../src')
const { getLoginJwt } = require('../src/test-utils')
const { verifyCredential } = require('did-jwt-vc')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')

const expectToThrowErrorMessage = async (fn, message) => {
  try {
    await fn()
    throw new Error('Did not throw any error')
  } catch (err) {
    expect(err.message).toEqual(message)
  }
}

describe('auth tests', () => {
  let identity, did, did2, signer, signer2, env, didResolver

  beforeAll(async () => {
    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)

    const privateKey = hdKey.derive(0).privateKey.toString('hex')
    identity = rskDIDFromPrivateKey()(privateKey)

    const privateKey2 = hdKey.derive(1).privateKey.toString('hex')
    const identity2 = rskDIDFromPrivateKey()(privateKey2)
    did2 = identity2.did
    signer2 = identity2.signer;

    ({ did, signer } = identity)
    env = {
      did,
      signer,
      rpcUrl: 'https://did.testnet.rsk.co:4444',
      authExpirationInHours: 4
    }

    const providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: env.rpcUrl }] }
    const ethrDidResolver = getResolver(providerConfig)
    didResolver = new Resolver(ethrDidResolver)
  })

  describe('non initialized validations', () => {
    it('getChallenge', () => {
      expectToThrowErrorMessage(() => getChallenge(), 'Library not initialized')
    })

    it('getAuthToken', () => {
      expectToThrowErrorMessage(() => getAuthToken(), 'Library not initialized')
    })

    it('authExpressMiddleware', () => {
      expectToThrowErrorMessage(() => authExpressMiddleware(), 'Library not initialized')
    })

    it('should throw an error if the challenge has not been asked before', async () => {
      initializeAuth(env)

      const jwt = await getLoginJwt('challenge', 'invalid', identity)

      await expectToThrowErrorMessage(() => getAuthToken(jwt), 'Request for a challenge before auth')
    })
  })

  describe('initialize', () => {
    it('should throw an error if not env provided', () => {
      expectToThrowErrorMessage(() => initializeAuth(), 'Missing env object')
    })

    it('should throw an error if not did provided', () => {
      expectToThrowErrorMessage(() => initializeAuth({}), 'Missing env variable: did')
    })

    it('should throw an error if not signer provided', () => {
      expectToThrowErrorMessage(() => initializeAuth({ did }), 'Missing env variable: signer')
    })

    it('should initialize the library and do not throw errors', () => {
      initializeAuth({ did, signer })
    })
  })

  describe('getChallenge', () => {
    it('should get a challenge given a did', () => {
      initializeAuth(env)

      const challenge = getChallenge(identity.did)

      expect(challenge).toBeTruthy()
      expect(challenge).toHaveLength(128)
    })

    it('should throw an error if no did', () => {
      initializeAuth(env)
      expectToThrowErrorMessage(() => getChallenge(), 'Invalid did')
    })
  })

  describe('getAuthToken', () => {
    beforeEach(() => {
      initializeAuth(env)
    })

    it('should throw an error if no jwt', async () => {
      await expectToThrowErrorMessage(() => getAuthToken(), 'JWT VC is required')
    })

    it('should throw an error if invalid jwt', async () => {
      await expectToThrowErrorMessage(() => getAuthToken('invalid'), 'Incorrect format JWT')
    })

    it('should throw an error when sending an invalid challenge', async () => {
      getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', 'invalid', identity)

      await expectToThrowErrorMessage(() => getAuthToken(jwt), 'Invalid challenge')
    })

    it('should throw an error when sending a challenge that is expired', async () => {
      jest.useFakeTimers()

      const challenge = getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', challenge, identity)

      jest.runAllTimers()
      await expectToThrowErrorMessage(() => getAuthToken(jwt), 'Request for a challenge before auth')
    })

    it('should throw an error when sending an invalid payload', async () => {
      getChallenge(identity.did)

      const jwt = await getLoginJwt('notWhatIsNeeded', 'invalid', identity)

      await expectToThrowErrorMessage(() => getAuthToken(jwt), 'Invalid payload, missing challenge claim')
    })

    it('should get a valid token when sending the proper challenge', async () => {
      const challenge = getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', challenge, identity)

      const token = await getAuthToken(jwt)

      expect(token).toBeTruthy()

      const { issuer, payload } = await verifyCredential(token, didResolver)

      expect(payload.sub).toEqual(identity.did)
      expect(payload.exp).toBeLessThan((Date.now() / 1000) + env.authExpirationInHours * 60 * 60 + 10) // added 10 seconds of grace
      expect(issuer).toContain(env.did)
    }, 8000)
  })

  describe('authExpressMiddleware', () => {
    const getMockedRes = (expectedError) => ({
      send: function (message) {
        expect(message).toBe(expectedError)
      },
      status: function (responseStatus) {
        expect(responseStatus).toBe(401)
        return this
      }
    })

    const getMockedReq = (token) => ({
      headers: {
        authorization: token
      }
    })

    let next

    beforeEach(() => {
      initializeAuth(env)

      next = jest.fn()
    })

    it('should call next() if valid token', async () => {
      const challenge = getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', challenge, identity)

      const token = await getAuthToken(jwt)

      const mockedReq = getMockedReq(token)
      const mockedRes = getMockedRes()

      await authExpressMiddleware(mockedReq, mockedRes, next)

      expect(next.mock.calls).toHaveLength(1)
    }, 8000)

    it('should return a no token message', async () => {
      const mockedReq = { headers: { } }

      await authExpressMiddleware(mockedReq, getMockedRes('No authorization header present'))
    })

    it('should return a no token message if empty token', async () => {
      const mockedReq = getMockedReq('')

      await authExpressMiddleware(mockedReq, getMockedRes('No authorization header present'))
    })

    it('should return an invalid format token message', async () => {
      const mockedReq = getMockedReq('invalid')

      await authExpressMiddleware(mockedReq, getMockedRes('Invalid token'))
    })

    it('should return invalid issuer message', async () => {
      /*
      * tries to send any other VC issued by an unknown issuer
      * this test uses the VC JWT generated by the client, doesn't matter the claims contained in it
      */

      const identity2 = { did: did2, signer: signer2 }

      const jwt = await getLoginJwt('does-not', 'matter', identity2)

      const mockedReq = getMockedReq(jwt)

      await authExpressMiddleware(mockedReq, getMockedRes('Invalid VC issuer'))
    }, 8000)

    it('should return max amount of requests reached', async () => {
      const newEnv = {
        ...env,
        maxRequestsPerToken: 3
      }

      initializeAuth(newEnv)

      const challenge = getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', challenge, identity)

      const token = await getAuthToken(jwt)

      const mockedReq = getMockedReq(token)
      const mockedRes = getMockedRes()

      // submit three requests
      await authExpressMiddleware(mockedReq, mockedRes, next)
      await authExpressMiddleware(mockedReq, mockedRes, next)
      await authExpressMiddleware(mockedReq, mockedRes, next)

      // the fourth one should return a 401
      await authExpressMiddleware(mockedReq, getMockedRes('Max amount of requests reached'))
    }, 12000)

    it('should return expired vc message', async () => {
      jest.useFakeTimers()

      initializeAuth(env)

      const challenge = getChallenge(identity.did)

      const jwt = await getLoginJwt('challenge', challenge, identity)

      const token = await getAuthToken(jwt)

      const mockedReq = getMockedReq(token)
      const mockedRes = getMockedRes()

      // submit first request and should work
      await authExpressMiddleware(mockedReq, mockedRes, next)

      jest.runAllTimers()
      await authExpressMiddleware(mockedReq, getMockedRes('Expired token'))
    }, 12000)
  })
})
