const express = require('express')
const cors = require('cors')
const { Message } = require('daf-core')
const { messageToRequest } = require('../lib/messageToRequest')

const debug = require('debug')('rif-id:services:backOffice')

function backOffice(port, agent) {
  const app = express()
  app.use(cors())

  app.get('/identity', function(req, res) {
    debug('Identity requested')

    agent.identityManager.getIdentities()
      .then(identities => {
        if (!identities) return res.status(500).send('No identity')
        res.status(200).send(identities[0].did)
      })
  })

  app.get('/requests', function(req, res) {
    debug(`Query requests`)

    agent.dbConnection.then(connection => connection.getRepository(Message).find()
      .then(messages => messages.map(messageToRequest))
      .then(requests => res.status(200).send(JSON.stringify(requests)))
    )
  })

  app.listen(port, () => debug(`Back office service started on port ${port}`))
}

module.exports = backOffice
