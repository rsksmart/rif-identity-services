import bodyParser from 'body-parser'
import { keccak256 } from 'js-sha3'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'
import createLogger from '../lib/logger'
import dotenv from 'dotenv'
import {
  getChallenge, getAuthToken, authExpressMiddleware, initializeAuth
} from '@rsksmart/rif-id-jwt-auth'

dotenv.config()

const logger = createLogger('rif-id:services:credentialRequests')

const serverCredentialMetadata = (type: string) => {
  switch(type) {
    case 'PARKING_PERMIT':
      return [
        { claimType: 'parkingPermitId', claimValue: '999999' },
        { claimType: 'typeOfVehicle', claimValue: 'Car' },
        { claimType: 'typeOfParkingPermit', claimValue: 'Normal' },
      ];
    case 'DRIVERS_LICENSE':
      return [
        { claimType: 'typeOfVehicle', claimValue: 'Car' },
        { claimType: 'typeOfLicense', claimValue: 'A1' },
        { claimType: 'isInternational', claimValue: false },
      ];
    default: return [];
  }
}

const makeCredential = (issuer, request) => {
  const nbf = Math.floor(new Date().getTime() / 1000);
  const exp = Math.floor((new Date().getTime() + (60000 * 60 * 24 * 365)) / 1000);

  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer,
    nbf,
    exp,
    credentialSubject: {
      id: request.from,
      fullName: request.fullName,
      type: request.type,
      otherClaims: [
        ...request.sdr,
        ...serverCredentialMetadata(request.type),
        { claimType: 'issuanceOffice', claimValue: 'Country Office' }
      ],
    }
  }
};

// dangerous !
const messageHashDictionary = {}

type CredentialRequestResponseStatus = 'PENDING' | 'DENIED' | 'SUCCESS' | 'ISSUED'

const credentialRequestResponsePayload = (status: CredentialRequestResponseStatus, raw: string) => ({ status, payload: { raw } })

export default function credentialRequestService(app, agent, env, credentialRequestServicePrefix = '') {
  initializeAuth(env)

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })

  app.post(credentialRequestServicePrefix + '/request-auth', bodyParser.json(), function (req, res) {
    try {
      const { did } = req.body

      logger.info(`${did} requested auth`)

      const challenge = getChallenge(did)

      res.status(200).send({ challenge })
    } catch (err) {
      logger.error('Caught error on /request-auth', err)
      res.status(500).send()
    }
  })

  app.post(credentialRequestServicePrefix + '/auth', bodyParser.json(), async function (req, res) {
    try {
      const { jwt } = req.body

      // logger.info(`${issuer} trying to log in`)

      getAuthToken(jwt)
        .then(token => res.status(200).send({ token }))
        .catch(err => res.status(401).send(err.message))
    } catch (err) {
      logger.error('Caught error on POST /auth', err)
      res.status(500).send()
    }
  })

  app.use(authExpressMiddleware)

  app.post(credentialRequestServicePrefix + '/requestCredential', bodyParser.text(), function(req, res) {
    try {
      const message = JSON.parse(req.body)
      logger.info(`Incoming credential request ${message.body}`)

      agent.handleMessage({ raw: message.body, meta: [] })
        .then(message => {
          const hash = (keccak256(message.raw) as any).toString('hex')

          const credRequest = {
            status: 'pending',
            message,
            hash,
          }

          agent.dbConnection
            .then(connection => connection.getRepository(CredentialRequest).save(credRequest))
            .then(credentialRequest => {

              messageHashDictionary[hash] = credentialRequest.id

              logger.info(`Credential request stored`)
              res.status(200).send()
            })
        })
        .catch(error => {
          logger.error('Caught error on /requestCredential', error)
          res.status(500).send('Unhandled error')
        });
    } catch (err) {
      logger.error('Caught error on /requestCredential', err)
      res.status(500).send('Unhandled error')
    }
  })

  app.get(credentialRequestServicePrefix + '/receiveCredential', function(req, res) {
    try {
      logger.info(`Incoming credential request`)

      const { hash } = req.query
      const id = messageHashDictionary[hash as string]

      agent.dbConnection.then(connection => {
        connection.getRepository(CredentialRequest).findOne(
        { 
          relations: ['message'],
          where: { id }
        })
        .then((cr: CredentialRequest) => {
          if (cr.status === 'denied') {
            res.status(200).send(credentialRequestResponsePayload('DENIED', cr.message.raw))
          } else if (cr.status === 'pending') {
            res.status(200).send(credentialRequestResponsePayload('PENDING', cr.message.raw))
          } else if (cr.status === 'issued') {
            res.status(200).send(credentialRequestResponsePayload('ISSUED', cr.message.raw))
          } else {
            const request = messageToRequest(cr)

            // save issued status to db:
            cr.status = 'issued';
            connection.getRepository(CredentialRequest).save(cr).then(() => {

            agent.identityManager.getIdentities()
              .then(identities => {
                agent.handleAction({
                  type: 'sign.w3c.vc.jwt',
                  save: true,
                  data: makeCredential(identities[0].did, request),
                }).then(vc => res.status(200).send(credentialRequestResponsePayload('SUCCESS', vc.raw)))
              })
            })
          }
        })
        .catch(e => {
          logger.error('Caught error on /receiveCredential', e)
          res.status(500).send()
        })
      })
    } catch (err) {
      logger.error('Caught error on /receiveCredential', err)
      res.status(500).send()
    }
  })
}
