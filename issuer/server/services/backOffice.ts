import basicAuth from 'express-basic-auth'
import bodyParser from 'body-parser'
import Debug from 'debug'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'

const debug = Debug('rif-id:services:backOffice')
const trace = v => { debug(v); return v }

export default function backOffice(app, agent, adminPass, backOfficePrefix = '') {
  const checkAuth = basicAuth({
    users: { 'admin': adminPass }
  })

  const getAllRequests = () => {
    return agent.dbConnection
      .then(connection => connection.getRepository(CredentialRequest).find({ relations: ['message'] }))
      .then(messages => messages.map(messageToRequest))
  }

  app.post(backOfficePrefix + '/auth', checkAuth, function (req, res) {
    res.status(200).send()
  })

  app.get(backOfficePrefix + '/identity', checkAuth, function(req, res) {
    debug('Identity requested')

    agent.identityManager.getIdentities()
      .then(identities => {
        if (!identities) return res.status(500).send('No identity')
        res.status(200).send(identities[0].did)
      })
  })

  app.get(backOfficePrefix + '/requests', checkAuth, function(req, res) {
    debug(`Query requests`)

    getAllRequests().then(requests => res.status(200).send(JSON.stringify(requests)))
  })

  app.put(backOfficePrefix + '/request/:id/status', checkAuth, bodyParser.json(), function(req, res) {
    const { id } = req.params
    const { status } = req.body
    debug(`PUT status ${status} for credential request ${id}`)

    if (status !== 'granted' && status !== 'denied') res.status(400).send('Invalid action')

    agent.dbConnection
      .then(connection => {
        return connection.getRepository(CredentialRequest).findOne({
          where: { id },
          relations: ['message']
        }).then(cr => {
          cr.status = status
          return connection.getRepository(CredentialRequest).save(cr)
        }).then(messageToRequest)
          .then(trace)
          .then(cr => res.status(200).send(JSON.stringify(cr)))
      })
  })

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })
  //app.listen(port, () => debug(`Back office service started on port ${port}`))
}
