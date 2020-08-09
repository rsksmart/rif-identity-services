/* env */
import dotenv from 'dotenv'
import Debug from 'debug'

/* server deps */
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

/* token gen */
import { randomBytes } from 'crypto'

/* W3C */
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
import EthrDID from 'ethr-did'
import { createVerifiableCredentialJwt } from 'did-jwt-vc'
import { verifyJWT } from 'did-jwt'

/* Data vault */
import { DataVaultProviderIPFS } from './lib/DataVaultProviderIPFS'

/* env */
dotenv.config()
const debug = Debug('rif-id:data-vault')
Debug.enable('*')

const env = {
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS,
  ipfsPort: process.env.IPFS_PORT ?? '',
  authExpirationTime: process.env.AUTH_EXPIRATION_TIME ?? '',
  port: process.env.PORT
}

/* setup app */
const app = express()
app.use(cors())

/* setup did resolver */
const providerConfig = { networks: [{ name: "rsk:testnet", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl: 'https://did.testnet.rsk.co:4444' }] }
const ethrDidResolver = getResolver(providerConfig)
const didResolver = new Resolver(ethrDidResolver)

const identity = new EthrDID({
  privateKey: env.privateKey,
  address: env.address
})

/* setup auth */
const authDictionary: any = {} // stores tokens and expiration time for given did

/* setup data vault */
const dataVaultProvider = new DataVaultProviderIPFS(
  { host: 'localhost', port: env.ipfsPort, protocol: 'http' },
  {}
)

debug(`Identity: ${identity.did}`)
dataVaultProvider.get('did:ethr:0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8')


app.get('/identity', function(req, res) {
  debug(`Requested identity`)
  res.status(200).send(identity.did)
})


const authenticate = (jwt: string) => verifyJWT(jwt, {
  resolver: didResolver
}).then(({ payload, issuer }) => {
  if (authDictionary[issuer].token !== payload.claims.find((claim: any) => claim.claimType === 'token').claimValue) throw new Error('Invalid token')
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
  const exp = Math.round((+Date.now() + parseInt(env.authExpirationTime)) / 1000)
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

const authenticateAndFindClaim = (jwt: string) => (claimType: any) => authenticate(jwt)
  .then(({ issuer, payload }) => ({ issuer, content: payload.claims.find((claim: any) => claim.claimType === claimType).claimValue }))

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

app.listen(env.port, () => debug(`Data vault started on port ${env.port}`))
