import basicAuth from 'express-basic-auth'
import bodyParser from 'body-parser'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'
import createLogger from '../lib/logger'
import dotenv from 'dotenv'

dotenv.config()

const logger = createLogger('rif-id:services:backOffice')
const trace = v => { logger.info(v); return v }

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
    logger.info('Identity requested')

    agent.identityManager.getIdentities()
      .then(identities => {
        if (!identities) return res.status(500).send('No identity')
        res.status(200).send(identities[0].did)
      })
      .catch(e => logger.error('Caught error on GET /identity', e))
  })

  app.get(backOfficePrefix + '/requests', checkAuth, function(req, res) {
    logger.info(`Query requests`)

    getAllRequests()
      .then(requests => res.status(200).send(JSON.stringify(requests)))
      .catch(e => logger.error('Caught error on GET /requests', e))
  })

  app.put(backOfficePrefix + '/request/:id/status', checkAuth, bodyParser.json(), function(req, res) {
    const { id } = req.params
    const { status } = req.body
    logger.info(`PUT status ${status} for credential request ${id}`)

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
      .catch(e => logger.error('Caught error on PUT /request/:id/status', e))

  })

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })
  //app.listen(port, () => debug(`Back office service started on port ${port}`))
}
