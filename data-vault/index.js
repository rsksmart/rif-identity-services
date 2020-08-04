require('dotenv').config()

/* server deps */
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

/* token gen */
const { randomBytes } = require('crypto')

/* W3C */
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { verifyJWT } = require('did-jwt')

/* Data vault */
const { DataVaultProviderIPFS } = require('./lib/DataVaultProviderIPFS')

/* debugger */
const Debug = require('debug')
const debug = Debug('rif-id:data-vault')

/*
User                                     Data Vault
 |                 Store cred.                |
 |                                            |
 | ----------- POST /auth { did } ----------> |---┐
 |                                            |  resolves did
 | <--------------- jwt(token) -------------- |<--┘
 |                                            |
 | -- POST /save jwt(payload, did, token) --> |---┐
 |                                            |  verify jwt
 |                                            |  verify token
 |                                            |  store { did, payload }
 | <------------------ cid -------------- |<--┘
 |                                            |
 |                                            |
 |               Recover creds.               |
 |                                            |
 | ----------- POST /auth { did } ----------> |---┐
 |                                            |  resolves did
 | <--------------- jwt(token) -------------- |<--┘
 |                                            |
 | ----- POST /recover jwt(did, token) -----> |---┐
 |                                            |  verify jwt
 |                                            |  verify token
 |                                            |  retrieve { did }
 | <----------------- cids ------------------ |<--┘
*/

Debug.enable('*')

/* setup app */
const app = express()
app.use(cors())

/* setup did resolver */
const providerConfig = { networks: [{ rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', name: 'rinkeby' }] }
const ethrDidResolver = getResolver(providerConfig)
const didResolver = new Resolver(ethrDidResolver)

const identity = new EthrDID({
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS
})

/* setup auth */
const authDictionary = {} // stores tokens and expiration time for given did

/* setup data vault */
const dataVaultProvider = new DataVaultProviderIPFS({ host: 'localhost', port: process.env.IPFS_PORT, protocol: 'http' })


app.get('/identity', function(req, res) {
  debug(`Requested identity`)
  res.status(200).send(identity.did)
})


const authenticate = (jwt) => verifyJWT(jwt, {
  issuer: identity,
  signer: identity.signer,
  resolver: didResolver
}).then(({ payload, issuer }) => {
  if (authDictionary[issuer].token !== payload.claims.find(claim => claim.claimType === 'token').claimValue) throw new Error('Invalid token')
  if (authDictionary[issuer].exp < Math.floor(+new Date() / 1000)) throw new Error('Token expired')
  return { payload, issuer }
})

app.post('/auth', bodyParser.json(), function(req, res) {
  const { did } = req.body
  const token = randomBytes(64).toString('hex')
  debug(`${did} requested auth - token ${token}`)

  const sub = did
  const iss = identity.did
  const nbf = Math.round((+Date.now()) / 1000)
  const exp = Math.round((+Date.now() + parseInt(process.env.AUTH_EXPIRATION_TIME)) / 1000)
  const credentialSubject = { token }

  authDictionary[did] = { token, exp }

  createVerifiableCredentialJwt({
    sub,
    iss,
    nbf,
    exp,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject
    }
  }, identity).then(jwt => res.status(200).send(jwt))
})

app.post('/testAuth', bodyParser.json(), function(req, res) {
  const { jwt } = req.body
  debug(`Testing auth`)

  authenticate(jwt)
    .then(() => res.status(200).send('Authenticated'))
    .catch(() => res.status(200).send('Not authenticated'))
})

const authenticateAndFindClaim = (jwt) => (claimType) => authenticate(jwt)
  .then(({ issuer, payload }) => ({ issuer, content: payload.claims.find(claim => claim.claimType === claimType).claimValue }))

app.post('/put', bodyParser.json(), function (req, res) {
  debug(`Put`)
  const { jwt } = req.body

  authenticateAndFindClaim(jwt)('content')
    .then(({ issuer, content }) => dataVaultProvider.put(issuer, Buffer.from(content)))
    .then(cid => res.status(200).send(cid))
})

app.post('/get', bodyParser.json(), function (req, res) {
  debug(`Get`)
  const { jwt } = req.body

  authenticate(jwt)
    .then(({ issuer }) => dataVaultProvider.get(issuer))
    .then(cids => res.status(200).send(JSON.stringify(cids)))
})

app.listen(process.env.PORT)
