import { createSelector } from 'reselect'
import { selectIdentities as _selectIdentities } from '../reducer/identityReducer'
import { RootIdentityState, IdentityState } from  '../store/identity'
import { HolderState } from '../store/holder'

const selectIdentitiesRoot = (state: RootIdentityState) => state.identity

export const selectIdentities = createSelector(
  selectIdentitiesRoot,
  _selectIdentities
)

export const selectIssuedCredentialRequestsRoot = (state: HolderState) => state.issuedCredentialRequests
