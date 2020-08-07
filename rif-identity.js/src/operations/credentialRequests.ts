import { Dispatch } from '@reduxjs/toolkit'
import { Agent } from 'daf-core'
import { ActionSendDIDComm } from 'daf-did-comm'
import { v4 as uuidv4 } from 'uuid'
import { CredentialRequest } from '../credentials'
import { credentialRequesToSelectiveDisclosureRequest, credentialRequesFromSelectiveDisclosureRequest } from '../credentials'
import { addIssuedCredentialRequest } from '../reducer/issuedCredentialRequestsReducer'

export const requestCredentialFactory = (agent: Agent) => (credentialRequest: CredentialRequest, url: string) => (dispatch: Dispatch) => {
  const id = uuidv4()

  dispatch(addIssuedCredentialRequest({ id, request: credentialRequest }))

  return agent.handleAction({
    type: 'sign.sdr.jwt', data: credentialRequesToSelectiveDisclosureRequest(credentialRequest)
  }).then(sdrJwt =>
    agent.handleAction({
      type: 'send.message.didcomm-alpha-1',
      data: {
        from: credentialRequest.subject,
        to: credentialRequest.issuer,
        type: 'jwt',
        body: sdrJwt,
      },
      url,
      save: false
    } as ActionSendDIDComm)
  ).then(message => ({
    id,
    message
  }))
}


