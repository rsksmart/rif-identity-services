const { randomBytes } = require('crypto')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { verifyJWT } = require('did-jwt')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')
const EthrDID = require('ethr-did')

const challenges = {}

let providerConfig, ethrDidResolver, didResolver, identity

const initializeAuth = (rpcUrl, address, privateKey) => {
  providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl }] }
  ethrDidResolver = getResolver(providerConfig)
  didResolver = new Resolver(ethrDidResolver)

  identity = new EthrDID({ privateKey, address })
}

const getChallenge = (did, expirationTimeInSeconds) => {
  const challenge = randomBytes(64).toString('hex')

  challenges[did] = challenge
  setTimeout(() => delete challenges[did], expirationTimeInSeconds * 1000)

  return challenge
}

const authExpressMiddleware = (req, res, next) => {
  next()
}

const getAuthToken = async (jwt, authExpirationInHours) => {
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
    exp: Math.round((+Date.now() / 1000)) + authExpirationInHours * 60 * 60,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        claims: 'TBD' // TODO
      }
    }
  }, identity)

  return token
}

module.exports = { getAuthToken, authExpressMiddleware, initializeAuth, getChallenge }
