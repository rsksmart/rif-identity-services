import { configureIdentityStore, IdentityState } from './identity'
import issuedCredentialRequestsReducer, { IssuedCredentialRequestsState } from '../reducer/issuedCredentialRequestsReducer'

export interface HolderState extends IdentityState {
  issuedCredentialRequests: IssuedCredentialRequestsState
}

export const configureHolderStore = () => configureIdentityStore({
  issuedCredentialRequests: issuedCredentialRequestsReducer
})

export type HolderStore = ReturnType<typeof configureHolderStore>
