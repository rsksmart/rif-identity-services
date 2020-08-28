/* server deps */
import { Express } from 'express'
import bodyParser from 'body-parser'

/* data base */
import { createConnection } from 'typeorm'

/* token gen */
import { randomBytes } from 'crypto'

/* W3C */
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
import EthrDID from 'ethr-did'
import { createVerifiableCredentialJwt } from 'did-jwt-vc'
import { verifyJWT } from 'did-jwt'

/* Data vault */
import { CentralizedIPFSPinnerProvider, Entities } from '../lib/DataVaultProviderIPFS'

import createLogger from '../lib/logger'
const logger = createLogger('rif-id:data-vault:services:centralized-pinner')

interface CentralizedIPFSPinnerEnv {
  privateKey: string;
  address: string;
  ipfsPort: string;
  ipfsHost: string;
  authExpirationTime: string;
  rpcUrl: string;
  dbFile: string;
}

export type DAFClaim = { claimType: string, claimValue: string }

function findClaims (claims: DAFClaim[], claimTypes: string[]) {
  const found: { [key: string]: string } = {}

  for (const claim of claims) {
    for (const claimType of claimTypes) {
      if (claim.claimType === claimType) { found[claimType] = claim.claimValue }
    }
  }

  return found
}

export function setupCentralizedIPFSPinner (app: Express, env: CentralizedIPFSPinnerEnv, prefix = ''): Promise<void> {
  /* setup did resolver */
  const providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: env.rpcUrl }] }
  const ethrDidResolver = getResolver(providerConfig)
  const didResolver = new Resolver(ethrDidResolver)

  const identity = new EthrDID({
    privateKey: env.privateKey,
    address: env.address
  })

  /* setup auth */
  // TODO: store in DB
  const authDictionary: { [issuer: string]: { token: string, exp: number } } = {} // stores tokens and expiration time for given did

  logger.info(`Identity: ${identity.did}`)

  return createConnection({
    type: 'sqlite',
    database: env.dbFile,
    entities: Entities,
    synchronize: true,
    logging: false
  }).then(dbConnection => {
    /* setup data vault */
    const dataVaultProvider = new CentralizedIPFSPinnerProvider({
      dbConnection,
      ipfsOptions: { host: env.ipfsHost, port: env.ipfsPort, protocol: 'http' }
    })

    /* authentication */
    const authenticate = (jwt: string) => verifyJWT(jwt, {
      resolver: didResolver
    }).then(({ payload, issuer }) => {
      if (authDictionary[issuer].token !== payload.claims.find((claim: DAFClaim) => claim.claimType === 'token').claimValue) throw new Error('Invalid token')
      if (authDictionary[issuer].exp < Math.floor(+new Date() / 1000)) throw new Error('Token expired')
      return { payload, issuer }
    })

    const authenticateAndFindClaims = (jwt: string) => (claimTypes: string[]) => authenticate(jwt)
      .then(({ issuer, payload }) => ({ issuer, claims: findClaims(payload.claims, claimTypes) }))

    app.get(prefix + '/identity', function (req, res) {
      logger.info('Requested identity')
      res.status(200).send(identity.did)
    })

    app.use(bodyParser.json({ limit: '50kb' }))

    app.post(prefix + '/auth', function (req, res) {
      const { did } = req.body
      const token = randomBytes(64).toString('hex')
      logger.info(`${did} requested auth - token ${token}`)

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

    app.post(prefix + '/testAuth', function (req, res) {
      const { jwt } = req.body
      logger.info('Testing auth')

      authenticate(jwt)
        .then(() => res.status(200).send('Authenticated'))
        .catch(() => res.status(200).send('Not authenticated'))
    })

    /* operations */
    app.post(prefix + '/put', function (req, res) {
      logger.info('Put')
      const { jwt } = req.body

      authenticateAndFindClaims(jwt)(['key', 'content'])
        .then(({ issuer, claims }) => dataVaultProvider.put(issuer, claims.key, Buffer.from(claims.content)))
        .then(cid => res.status(200).send(cid))
    })

    app.post(prefix + '/get', function (req, res) {
      logger.info('Get')
      const { jwt } = req.body

      authenticateAndFindClaims(jwt)(['key'])
        .then(({ issuer, claims }) => dataVaultProvider.get(issuer, claims.key))
        .then(cids => res.status(200).send(JSON.stringify(cids)))
    })

    app.post(prefix + '/delete', function (req, res) {
      logger.info('Delete')
      const { jwt } = req.body

      authenticateAndFindClaims(jwt)(['key', 'cid'])
        .then(({ issuer, claims }) => dataVaultProvider.delete(issuer, claims.key, claims.cid))
        .then(() => res.status(204).send())
    })

    app.get('/__health', function (req, res) {
      res.status(200).end('OK')
    })
  })
  .catch(e => logger.error('Caught error', e))
}
