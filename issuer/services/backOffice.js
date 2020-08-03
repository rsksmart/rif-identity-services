const express = require('express')
const cors = require('cors')
const { Message } = require('daf-core')
const debug = require('debug')('rif-id:services:backoffice')

function messageToRequest(message) {
  let request

  if (message.data.claims.find(c => c.claimType === 'credentialRequest' && c.claimValue === 'cred1')) {
    const from = message.data.iss
    const name = message.data.claims.find(c => c.claimType === 'name').claimValue
    const sdr = message.data.claims.filter(c => c.claimType !== 'credentialRequest')
    const isValid = message.metaData.indexOf({ type: 'JWT', value: 'ES256K-R' })

    if (from || name || sdr.length === 0) request = { from, name, sdr, isValid }
  }

  if (!request) throw new Error('Invalid request')

  return request
}

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
