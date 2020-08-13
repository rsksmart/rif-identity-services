import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { keccak256 } from 'js-sha3'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'
import Debug from 'debug'

const debug = Debug('rif-id:services:credentialRequests')

const makeCredential = (issuer, request) => ({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  issuer,
  credentialSubject: {
    id: request.from,
    fullName: request.fullName,
    type: request.type,
    otherClaims: [...request.sdr]
  }
})

// dangerous !
const messageHashDictionary = {}

type CredentialRequestResponseStatus = 'PENDING' | 'DENIED' | 'SUCCESS'

const credentialRequestResponsePayload = (status: CredentialRequestResponseStatus, raw: string) => ({ status, payload: { raw } })

export default function credentialRequestService(port, agent) {
  const app = express()
  app.use(cors())

  app.post('/requestCredential', bodyParser.text(), function(req, res) {
    const message = JSON.parse(req.body)
    debug(`Incoming credential request ${message.body}`)

    agent.handleMessage({ raw: message.body, meta: [] })
      .then(message => {
        const hash = keccak256(message.raw).toString('hex')

        const credRequest = {
          status: 'pending',
          message,
          hash,
        }

        agent.dbConnection
          .then(connection => connection.getRepository(CredentialRequest).save(credRequest))
          .then(credentialRequest => {

            messageHashDictionary[hash] = credentialRequest.id

            debug(`Credential request stored`)
            res.status(200).send()
          })
      })
  })

  app.get('/receiveCredential', function(req, res) {
    debug(`Incoming credential request`)

    const { hash } = req.query
    const id = messageHashDictionary[hash as string]

    agent.dbConnection.then(connection => connection.getRepository(CredentialRequest).findOne(
      { 
        relations: ['message'],
        where: { id }
      }
    ))
      .then((cr: CredentialRequest) => {
        if (cr.status === 'denied') {
          res.status(200).send(credentialRequestResponsePayload('DENIED', cr.message.raw))
        } else if (cr.status === 'pending') {
          res.status(200).send(credentialRequestResponsePayload('PENDING', cr.message.raw))
        } else {
          const request = messageToRequest(cr)

          agent.identityManager.getIdentities()
            .then(identities => {
              agent.handleAction({
                type: 'sign.w3c.vc.jwt',
                save: true,
                data: makeCredential(identities[0].did, request),
              }).then(vc => res.status(200).send(credentialRequestResponsePayload('SUCCESS', vc.raw)))
            })
        }
      })
  })

  app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}
