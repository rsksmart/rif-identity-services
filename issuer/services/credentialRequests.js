const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const debug = require('debug')('rif-id:services:credentialRequests')

function credentialRequestService(port) {
  const app = express()
  app.use(cors())

  app.post('/requestCredential', bodyParser.text(), function(req, res) {
    debug(JSON.parse(req.body))
    res.status(200).send({})
  })

  app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}

module.exports = credentialRequestService
