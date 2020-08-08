import express from 'express'
import cors from 'cors'
import { Message } from 'daf-core'
import { messageToRequest } from '../lib/messageToRequest'
import Debug from 'debug'
import CredentialRequest from '../lib/CredentialRequest'

const debug = Debug('rif-id:services:backOffice')

export default function backOffice(port, agent) {
  const app = express()
  app.use(cors())

  const getAllRequests = () => {
    return agent.dbConnection
      .then(connection => connection.getRepository(CredentialRequest).find({ relations: ['message'] }))
      .then(messages => messages.map(messageToRequest))
  }

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

    getAllRequests().then(requests => res.status(200).send(JSON.stringify(requests)))
  })

  app.put('/request/grant/:id', function(req, res) {
    const { id } = req.params
    debug(`Grant credential request ${id}`)

    let connection
    agent.dbConnection
      .then(conn => {
        connection = conn;
        return connection.getRepository(CredentialRequest).findOne(      { 
          relations: ['message'],
          where: { id }
        })
      })
      .then(cr => {
        cr.status = 'granted'
        return connection.getRepository(CredentialRequest).save(cr)
      })
      .then(getAllRequests)
      .then(requests => res.status(200).send(JSON.stringify(requests)))
  })

  app.put('/request/deny/:id', function(req, res) {
    const { id } = req.params
    debug(`Deny credential request ${id}`)

    let connection
    agent.dbConnection
      .then(conn => {
        connection = conn;
        return connection.getRepository(CredentialRequest).findOne(      { 
          relations: ['message'],
          where: { id }
        })
      })
      .then(cr => {
        cr.status = 'denied'
        return connection.getRepository(CredentialRequest).save(cr)
      })
      .then(getAllRequests)
      .then(requests => res.status(200).send(JSON.stringify(requests)))
  })

  app.listen(port, () => debug(`Back office service started on port ${port}`))
}
