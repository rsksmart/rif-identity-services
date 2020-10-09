const bodyParser = require('body-parser')
const IPFSHttpClient = require('ipfs-http-client')
const { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } = require('@rsksmart/rif-id-ethr-did')

const { authExpressMiddleware, getChallenge, getAuthToken, initializeAuth } = require('@rsksmart/express-did-auth')



function convey (app, env, logger, prefix = '') {
  const { ipfsOptions } = env
  const url = ipfsOptions ? `${ipfsOptions.protocol}://${ipfsOptions.host}:${ipfsOptions.port}` : 'http://localhost:5001'
  const ipfsClient = IPFSHttpClient({ url })

  const didFromPrivateKey = env.networkName === 'rsk:testnet' ? rskTestnetDIDFromPrivateKey() : rskDIDFromPrivateKey()

  if (!env.privateKey) {
    throw Error('Missing privateKey')
  }
  const { did, signer } = didFromPrivateKey(env.privateKey)
  logger.info(`Generated DID: ${did}`)

  initializeAuth({
    ...env,
    did,
    signer
  })
  app.use(bodyParser.json())

  const files = {}

  app.get('/__health', async function (req, res) {
    res.status(204).send()
  })

  app.post(prefix + '/request-auth', function (req, res) {
    try {
      const { did } = req.body

      logger.info(`${did} requested auth`)

      const challenge = getChallenge(did)

      res.status(200).send({ challenge })
    } catch (err) {
      logger.error('Caught error on /request-auth', err)
      res.status(500).send()
    }
  })

  app.post(prefix + '/auth', async function (req, res) {
    try {
      const { jwt } = req.body

      // logger.info(`${issuer} trying to log in`)

      getAuthToken(jwt)
        .then(token => res.status(200).send({ token }))
        .catch(err => res.status(401).send(err.message))
    } catch (err) {
      logger.error('Caught error on POST /auth', err)
      res.status(500).send()
    }
  })

  app.use(authExpressMiddleware)

  app.post(prefix + '/file', async function (req, res) {
    try {
      const { file } = req.body

      if (!file) {
        throw new Error('Invalid content')
      }

      logger.info(`Incoming file ${file}`)

      const addedContent = await ipfsClient.add(file)
      const cid = addedContent.path
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
}

module.exports = convey
