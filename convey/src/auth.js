const { randomBytes } = require('crypto')
const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc')
const { verifyJWT } = require('did-jwt')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')
const EthrDID = require('ethr-did')
const { keccak256 } = require('js-sha3')

const challenges = {}
const tokenRequestCounter = {}

let
  providerConfig, ethrDidResolver, didResolver, identity, address,
  challengeExpirationInSeconds, maxRequestsPerToken, rpcUrl, authExpirationInHours

const initializeAuth = (env) => {
  if (!env) {
    throw new Error('Missing env object')
  }

  let privateKey

  rpcUrl = env.rpcUrl || 'https://did.testnet.rsk.co:4444'
  challengeExpirationInSeconds = env.challengeExpirationInSeconds || 300
  authExpirationInHours = env.authExpirationInHours || 10
  maxRequestsPerToken = env.maxRequestsPerToken || 20;

  ({ address, privateKey } = env)

  if (!address) {
    throw new Error('Missing env variable: address')
  }

  if (!privateKey) {
    throw new Error('Missing env variable: privateKey')
  }

  providerConfig = {
    networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl }]
  }
  ethrDidResolver = getResolver(providerConfig)
  didResolver = new Resolver(ethrDidResolver)

  identity = new EthrDID({ privateKey, address })
}

const getChallenge = (did) => {
  if (!identity) {
    throw new Error('Library not initialized')
  }

  if (!did) {
    throw new Error('Invalid did')
  }

  const challenge = randomBytes(64).toString('hex')

  challenges[did] = challenge
  setTimeout(() => delete challenges[did], challengeExpirationInSeconds * 1000)

  return challenge
}

const getAuthToken = async (jwt) => {
  if (!identity) {
    throw new Error('Library not initialized')
  }

  if (!jwt) {
    throw new Error('JWT VC is required')
  }

  const { payload, issuer } = await verifyJWT(jwt, { resolver: didResolver })

  if (!challenges[issuer]) {
    throw new Error('Request for a challenge before auth')
  }

  const challengeClaim = payload.vc.credentialSubject.claims.find(
    (claim) => claim.claimType === 'challenge'
  )

  if (!challengeClaim || !challengeClaim.claimValue) {
    throw new Error('Invalid payload, missing challenge claim')
  }
  if (challenges[issuer] !== challengeClaim.claimValue) {
    throw new Error('Invalid challenge')
  }

  const token = await createVerifiableCredentialJwt({
    sub: issuer,
    iss: identity.did,
    nbf: Math.round((+Date.now()) / 1000),
    exp: Math.round((+Date.now() / 1000) + authExpirationInHours * 60 * 60),
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        claims: [
          { claimType: 'authToken' }
        ]
      }
    }
  }, identity)

  const hash = keccak256(token).toString('hex')
  tokenRequestCounter[hash] = 0

  return token
}

const authExpressMiddleware = async (req, res, next) => {
  if (!identity) {
    throw new Error('Library not initialized')
  }

  // eslint-disable-next-line dot-notation
  const token = req.headers['authorization']

  if (token) {
    try {
      const { issuer } = await verifyCredential(token, didResolver)

      if (issuer !== identity.did) {
        res.status(401).send('Invalid VC issuer')
      } else {
        const hash = keccak256(token).toString('hex')

        tokenRequestCounter[hash]++

        if (tokenRequestCounter[hash] <= maxRequestsPerToken) {
          next()
        } else {
          res.status(401).send('Max amount of requests reached')
        }
      }
    } catch (err) {
      if (err.message.toLowerCase().includes('jwt has expired')) {
        res.status(401).send('Expired token')
      } else if (err.message.toLowerCase().includes('incorrect format jwt')) {
        res.status(401).send('Invalid token')
      } else {
        res.status(401).send(err.message)
      }
    }
  } else {
    res.status(401).send('No authorization header present')
  }
}

module.exports = { getAuthToken, authExpressMiddleware, initializeAuth, getChallenge }
