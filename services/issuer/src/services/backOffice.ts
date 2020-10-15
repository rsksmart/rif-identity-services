import basicAuth from 'express-basic-auth'
import bodyParser from 'body-parser'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'
import createLogger from '../lib/logger'

const logger = createLogger('rif-id:services:backOffice')
const trace = v => { logger.info(JSON.stringify(v)); return v }

export default function backOffice(app, agent, adminUser, adminPass, backOfficePrefix = '') {

  function logIfError(fn, req, res) {
    try {
      fn(req, res)
    } catch(err) {
      logger.error('Caught error', err)
      res.status(500).send('Unhandled error')
    }
  }

  function getAllRequests() {
    return agent.dbConnection
      .then(connection => connection.getRepository(CredentialRequest).find({ relations: ['message'] }))
      .then(messages => messages.map(messageToRequest))
  }

  function getIdentity(req, res) {
    logger.info('Identity requested')

    agent.identityManager.getIdentities()
      .then(identities => {
        if (!identities) return res.status(500).send('No identity')
        res.status(200).send(identities[0].did)
      })
      .catch(e => {
        logger.error('Caught error on GET /identity', e)
        res.status(500).send()
      })
  }

  function getRequests(req, res) {
    logger.info(`Query requests`)

    getAllRequests()
      .then(requests => res.status(200).send(JSON.stringify(requests)))
      .catch(e => {
        logger.error('Caught error on GET /requests', e)
        res.status(500).send()
      })
  }

  function updateRequestById(req, res) {
    const { id } = req.params
    const { status } = req.body

    logger.info(`PUT status ${status} for credential request ${id}`)

    if (status !== 'granted' && status !== 'denied') return res.status(400).send('Invalid action')

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
      .catch(e => {
        logger.error('Caught error on PUT /request/:id/status', e)
        res.status(500).send()
      })
  }

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })

  const users = {}
  users[adminUser] = adminPass
  app.use(basicAuth({ users }))

  app.post(backOfficePrefix + '/auth', function (req, res) {
    res.status(200).send()
  })

  app.get(backOfficePrefix + '/identity', (req, res) => logIfError(getIdentity, req, res))

  app.get(backOfficePrefix + '/requests', (req, res) => logIfError(getRequests, req, res))

  app.put(backOfficePrefix + '/request/:id/status', bodyParser.json(), (req, res) => logIfError(updateRequestById, req, res))

  //app.listen(port, () => debug(`Back office service started on port ${port}`))
}
