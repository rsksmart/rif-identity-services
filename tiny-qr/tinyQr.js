const bodyParser = require('body-parser')
const Debug = require('debug')
const crypto = require('crypto')

const debug = Debug('rif-id:services:tiny-qr')

function tinyQr(app, serviceUrl, suffix = '') {
  app.use(bodyParser.json())

  let presentations = {};

  app.post(suffix + '/presentation', async function(req, res) {
    const { jwt } = req.body

    debug(`Incoming presentation JWT ${jwt}`)

    const id = (await crypto.randomBytes(4)).toString('hex')
    const pwd = (await crypto.randomBytes(32)).toString('hex')

    const presentation = { jwt, pwd }

    presentations[id] = presentation;

    const response = {
      url: `${serviceUrl}${suffix}/jwt/${id}`,
      pwd
    }

    res.json(response).end()
  })

  app.post(suffix + '/jwt/:id', function(req, res) {
    const { id } = req.params
    const { pwd } = req.body

    debug(`Incoming JWT request with id ${id} - pwd ${pwd}`)

    const presentation = presentations[id]

    if (presentation && presentation.pwd == pwd) {
      res.json({ jwt: presentation.jwt }).end()
    } else {
      res.status(404).end()
    }
  })

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })
}

module.exports = tinyQr;
