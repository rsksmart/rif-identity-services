const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const debug = require('debug')('rif-id:services:credentialRequests')

function credentialRequestService(port, agent) {
  const app = express()
  app.use(cors())

  app.post('/requestCredential', bodyParser.text(), function(req, res) {
    const message = JSON.parse(req.body)

    debug(`Incoming credential request ${message.body}`)

    agent.handleMessage({ raw: message.body, meta: [] })

    res.status(200).send({})
  })

  app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}

module.exports = credentialRequestService
