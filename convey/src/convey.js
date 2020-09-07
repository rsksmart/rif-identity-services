const bodyParser = require('body-parser')
const RIFStorage = require('@rsksmart/rif-storage')
const createLogger = require('./logger')
const { getResolver } = require('ethr-did-resolver')
const { Resolver } = require('did-resolver')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { verifyJWT } = require('did-jwt')
const { randomBytes } = require('crypto')
const logger = createLogger('rif-id:services:convey')
const { Provider } = RIFStorage

function convey (app, env, prefix = '') {
  const providerConfig = { networks: [{ name: 'rsk:testnet', registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b', rpcUrl: env.rpcUrl }] }
  const ethrDidResolver = getResolver(providerConfig)
  const didResolver = new Resolver(ethrDidResolver)

  const identity = new EthrDID({
    privateKey: env.privateKey,
    address: env.address
  })

  const storage = RIFStorage.default(Provider.IPFS, env.ipfsOptions || { host: 'localhost', port: '5001', protocol: 'http' })

  app.use(bodyParser.json())

  const files = {}

  const challenges = {}

  app.post(prefix + '/request-auth', function (req, res) {
    try {
      const { did } = req.body

      const challenge = randomBytes(64).toString('hex')

      logger.info(`${did} requested auth - challenge ${challenge}`)

      challenges[did] = challenge
      setTimeout(() => delete challenges[did], env.challengeExpirationInSeconds * 1000)

      res.status(200).send({ challenge })
    } catch (err) {
      logger.error('Caught error on /request-auth', err)
      res.status(500).send()
    }
  })

  app.post(prefix + '/auth', async function (req, res) {
    try {
      const { jwt } = req.body

      const { payload, issuer } = await verifyJWT(jwt, { resolver: didResolver })

      logger.info(`${issuer} trying to log in`)

      if (!challenges[issuer]) {
        res.status(401).send('Request for a challenge before auth')
      } else {
        const challengeClaim = payload.vc.credentialSubject.claims.find(
          (claim) => claim.claimType === 'challenge'
        )

        if (!challengeClaim || !challengeClaim.claimValue) {
          res.status(401).send('Invalid payload, missing challenge claim')
        } else if (challenges[issuer] !== challengeClaim.claimValue) {
          res.status(401).send('Invalid challenge')
        } else {
          const token = await createVerifiableCredentialJwt({
            sub: issuer,
            iss: identity.did,
            nbf: Math.round((+Date.now()) / 1000),
            exp: Math.round((+Date.now() / 1000)) + env.authExpirationInHours * 60 * 60,
            vc: {
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              type: ['VerifiableCredential'],
              credentialSubject: {
                claims: 'TBD'
              }
            }
          }, identity)

          res.status(200).send({ token })
        }
      }
    } catch (err) {
      console.log(err)
      logger.error('Caught error on POST /auth', err)
      res.status(500).send()
    }
  })

  app.post(prefix + '/file', async function (req, res) {
    try {
      const { file } = req.body
      logger.info(`Incoming file ${file}`)

      const cid = await storage.put(file)
      logger.info('Stored hash: ' + cid)

      files[cid] = file

      const url = `convey://${cid}`

      res.json({ cid, url }).end()
    } catch (err) {
      logger.error('Caught error on POST /file', err)
      res.status(500).send()
    }
  })

  app.get(prefix + '/file/:cid', function (req, res) {
    const { cid } = req.params

    logger.info(`Incoming file request: cid: ${cid}`)

    if (cid) {
      const file = files[cid]

      if (file) {
        res.json({ file }).end()
      } else {
        res.status(404).end()
      }
    } else {
      res.status(404).end()
    }
  })

  app.get('/__health', async function (req, res) {
    try {
      const expected = Math.random().toString(36).substring(3, 11)

      const cid = await storage.put(expected)

      files[cid] = expected

      const actual = files[cid]

      if (cid && actual === expected) {
        res.status(200).send('OK')
      } else {
        logger.warn(`Status check comparison failed: Expected file: ${expected}. Actual: ${actual}. Cid: ${cid}`)
        res.status(500).end()
      }
    } catch (err) {
      console.log('err')
      console.log(err)
      logger.error('Status check failed due an exception', err)
      res.status(500).end()
    }
  })
}

module.exports = convey
