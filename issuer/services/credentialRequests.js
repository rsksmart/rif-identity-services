const express = require('express')
const bodyParser = require('body-parser')
const debug = require('debug')('rif-id:services:credentialRequests')

function credentialRequestService(port) {
  const app = express()

  app.post('/requestCredential', bodyParser.json(), function(req, res) {
    debug(req.body)
    res.status(200).send({})
  })

  app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}

module.exports = credentialRequestService
