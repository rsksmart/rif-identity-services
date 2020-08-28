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
import { DataVaultProviderIPFS, Entities } from '../lib/DataVaultProviderIPFS'
import logger from '../lib/logger'

interface CentralizedIPFSPinnerEnv {
  privateKey: string;
  address: string;
  ipfsPort: string;
  ipfsHost: string;
  authExpirationTime: string;
  rpcUrl: string;
  dbFile: string;
}

export function setupCentralizedIPFSPinner(app: Express, env: CentralizedIPFSPinnerEnv, prefix = '') {
  /* setup did resolver */
  const providerConfig = { networks: [{ name: "rsk:testnet", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl: env.rpcUrl }] }
  const ethrDidResolver = getResolver(providerConfig)
  const didResolver = new Resolver(ethrDidResolver)

  const identity = new EthrDID({
    privateKey: env.privateKey,
    address: env.address
  })

  /* setup auth */
  const authDictionary: any = {} // stores tokens and expiration time for given did

  logger.info(`Identity: ${identity.did}`)

  return createConnection({
    type: 'sqlite',
    database: env.dbFile,
    entities: Entities,
    synchronize: true,
    logging: false
  }).then(connection => {
    /* setup data vault */
    const dataVaultProvider = new DataVaultProviderIPFS(
      connection,
      { host: env.ipfsHost, port: env.ipfsPort, protocol: 'http' }
    )

    /* authentication */
    const authenticate = (jwt: string) => verifyJWT(jwt, {
      resolver: didResolver
    }).then(({ payload, issuer }) => {
      if (authDictionary[issuer].token !== payload.claims.find((claim: any) => claim.claimType === 'token').claimValue) throw new Error('Invalid token')
      if (authDictionary[issuer].exp < Math.floor(+new Date() / 1000)) throw new Error('Token expired')
      return { payload, issuer }
    })

    const authenticateAndFindClaim = (jwt: string) => (claimType: any) => authenticate(jwt)
      .then(({ issuer, payload }) => ({ issuer, content: payload.claims.find((claim: any) => claim.claimType === claimType).claimValue }))

    app.get(prefix + '/identity', function(req, res) {
      logger.info(`Requested identity`)
      res.status(200).send(identity.did)
    })

    app.use(bodyParser.json({ limit: '50kb'} ))

    app.post(prefix + '/auth', function(req, res) {
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

    app.post(prefix + '/testAuth', function(req, res) {
      const { jwt } = req.body
      logger.info(`Testing auth`)

      authenticate(jwt)
        .then(() => res.status(200).send('Authenticated'))
        .catch(() => res.status(200).send('Not authenticated'))
    })

    /* operations */
    app.post(prefix + '/put', function (req, res) {
      logger.info(`Put`)
      const { jwt, key } = req.body

      authenticateAndFindClaim(jwt)('content')
        .then(({ issuer, content }) => dataVaultProvider.put(issuer, key, Buffer.from(content)))
        .then(cid => res.status(200).send(cid))
    })

    app.post(prefix + '/get', function (req, res) {
      logger.info(`Get`)
      const { jwt, key } = req.body

      authenticate(jwt)
        .then(({ issuer }) => dataVaultProvider.get(issuer, key))
        .then(cids => res.status(200).send(JSON.stringify(cids)))
    })

    app.post(prefix + '/delete', function (req, res) {
      logger.info(`Delete`)
      const { jwt, key, cid } = req.body

      authenticate(jwt)
        .then(({ issuer }) => dataVaultProvider.delete(issuer, key, cid))
        .then(() => res.status(204).send())
    })

    app.get('/__health', function (req, res) {
      res.status(200).end('OK')
    })
  })
}
