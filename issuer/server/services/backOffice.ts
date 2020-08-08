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

  app.put('/request/:id/status/:status', function(req, res) {
    const { status, id } = req.params
    debug(`PUT status ${status} for credential request ${id}`)

    if (status !== 'granted' && status !== 'denied') res.status(500).send('Invalid action')

    agent.dbConnection
      .then(connection => {
        return connection.getRepository(CredentialRequest).findOne({
          where: { id },
          relations: ['message']
        }).then(cr => {
          cr.status = status
          return connection.getRepository(CredentialRequest).save(cr)
        }).then(messageToRequest)
          .then(cr => { debug(cr); res.status(200).send(JSON.stringify(cr)) })
      })
  })

  app.listen(port, () => debug(`Back office service started on port ${port}`))
}
