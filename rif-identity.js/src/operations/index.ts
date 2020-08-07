import { Agent } from 'daf-core'
import { initIdentityFactory, createIdentityFactory } from './identity'
import { requestCredentialFactory } from './credentialRequests'

export const identityOperationsFactory = (agent: Agent) => {
  const initIdentity = initIdentityFactory(agent)
  const createIdentity = createIdentityFactory(agent)

  return Object.freeze({
    initIdentity,
    createIdentity
  })
}

export const credentialRequestsOperationsFactory = (agent: Agent) => {
  const requestCredential = requestCredentialFactory(agent)

  return Object.freeze({
    requestCredential
  })
}
