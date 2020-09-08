const bodyParser = require('body-parser')
const RIFStorage = require('@rsksmart/rif-storage')
const createLogger = require('./logger')

const logger = createLogger('rif-id:services:convey')
const { Provider } = RIFStorage
const { authExpressMiddleware, getChallenge, getAuthToken, initializeAuth } = require('./auth')

function convey (app, env, prefix = '') {
  const storage = RIFStorage.default(Provider.IPFS, env.ipfsOptions || { host: 'localhost', port: '5001', protocol: 'http' })

  initializeAuth(env)
  app.use(bodyParser.json())

  const files = {}

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
      logger.error('Status check failed due an exception', err)
      res.status(500).end()
    }
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

      getAuthToken(jwt, env.authExpirationInHours)
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
}

module.exports = convey
