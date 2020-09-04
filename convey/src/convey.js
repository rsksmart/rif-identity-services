const bodyParser = require('body-parser')
const RIFStorage = require('@rsksmart/rif-storage')
const createLogger = require('./logger')

const logger = createLogger('rif-id:services:convey')
const { Provider } = RIFStorage

function convey (app, ipfsOptions, prefix = '') {
  const storage = RIFStorage.default(Provider.IPFS, ipfsOptions || { host: 'localhost', port: '5001', protocol: 'http' })

  app.use(bodyParser.json())

  const files = {}

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

    const file = files[cid]

    if (file) {
      res.json({ file }).end()
    } else {
      res.status(404).end()
    }
  })

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })
}

module.exports = convey
