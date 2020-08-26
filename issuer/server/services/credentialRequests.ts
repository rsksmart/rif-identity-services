import bodyParser from 'body-parser'
import { keccak256 } from 'js-sha3'
import { messageToRequest } from '../lib/messageToRequest'
import CredentialRequest from '../lib/CredentialRequest'
import Debug from 'debug'

const debug = Debug('rif-id:services:credentialRequests')

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

type CredentialRequestResponseStatus = 'PENDING' | 'DENIED' | 'SUCCESS'

const credentialRequestResponsePayload = (status: CredentialRequestResponseStatus, raw: string) => ({ status, payload: { raw } })

export default function credentialRequestService(app, agent, credentialRequestServicePrefix = '') {
  app.post(credentialRequestServicePrefix + '/requestCredential', bodyParser.text(), function(req, res) {
    const message = JSON.parse(req.body)
    debug(`Incoming credential request ${message.body}`)

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

            debug(`Credential request stored`)
            res.status(200).send()
          })
      })
      .catch(error => {
        debug(error)
        res.status(500).send('Unhandled error')
      });
  })

  app.get(credentialRequestServicePrefix + '/receiveCredential', function(req, res) {
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

  app.get('/__health', function (req, res) {
    res.status(200).end('OK')
  })
  // app.listen(port, () => debug(`Credential requests service started on port ${port}`))
}
