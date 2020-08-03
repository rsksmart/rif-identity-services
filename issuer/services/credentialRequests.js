const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const keccak256 = require('keccak256')
const { Message } = require('daf-core')
const { messageToRequest } = require('../lib/messageToRequest')

const debug = require('debug')('rif-id:services:credentialRequests')

const makeCredential = (issuer, request) => ({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  issuer,
  credentialSubject: {
    id: request.from,
    name: request.name,
    otherClaims: request.sdr
  }
})

// dangerous !
const messageHashDictionary = {}

function credentialRequestService(port, agent) {
  const app = express()
  app.use(cors())

  app.post('/requestCredential', bodyParser.text(), function(req, res) {
    const message = JSON.parse(req.body)
    debug(`Incoming credential request ${message.body}`)

    agent.handleMessage({ raw: message.body, meta: [] })
      .then(handledMessage => {
        const hash = keccak256(handledMessage.raw).toString('hex')
        messageHashDictionary[hash] = handledMessage.id
        debug(`Credential request stored`)
        res.status(200).send()
      })
  })

  app.get('/receiveCredential', function(req, res) {
    debug(`Incoming credential request`)

    const { hash } = req.query
    const id = messageHashDictionary[hash]

    agent.dbConnection.then(connection => connection.getRepository(Message).findOne(id))
      .then(messageToRequest)
      .then(request => {
        agent.identityManager.getIdentities()
          .then(identities => {
            agent.handleAction({
              type: 'sign.w3c.vc.jwt',
              save: true,
              data: makeCredential(identities[0].did, request),
            }).then(vc => res.status(200).send(vc.raw))
          })
      })
  })

  app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}

module.exports = credentialRequestService
