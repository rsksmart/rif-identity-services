import { Agent } from 'daf-core'
import { Identity } from './Identity'
import { configureHolderStore } from '../store/holder'
import { credentialRequestsOperationsFactory } from '../operations'
import { CredentialRequest } from '../credentials'
import { selectIssuedCredentialRequests } from '../reducer/issuedCredentialRequestsReducer'
import { selectIssuedCredentialRequestsRoot } from '../selectors'

export class Holder extends Identity {
  credentialRequestsOperations: ReturnType<typeof credentialRequestsOperationsFactory>

  constructor(agent: Agent, dataVault: any) {
    const store = configureHolderStore()
    super(agent, dataVault, store)

    this.credentialRequestsOperations = credentialRequestsOperationsFactory(agent)
  }

  get credentialRequests () {
    return selectIssuedCredentialRequests(selectIssuedCredentialRequestsRoot(this.state))
  }

  public async requestCredential(credentialRequest: CredentialRequest, url: string) {
    return this.dispatch(this.credentialRequestsOperations.requestCredential(credentialRequest, url))
  }
}
