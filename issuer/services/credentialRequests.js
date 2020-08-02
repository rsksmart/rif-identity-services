const express = require('express')
const bodyParser = require('body-parser')
const debug = require('debug')('rif-id:services:credentialRequests')

function credentialRequestService() {
  const app = express()

  app.post('/requestCredential', bodyParser.json(), function(req, res) {
    debug(req.body)
  })

  app.listen(process.env.CREDENTIAL_REQUESTS_PORT, () => debug(`Issuer app started on port ${process.env.CREDENTIAL_REQUESTS_PORT}`))
}

module.exports = {
  credentialRequestService
}
