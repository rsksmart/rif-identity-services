import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { CredentialRequest } from '../credentials'

enum IssuedCredentialRequestStatus {
  READY = 'READY',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface IssuedCredentialRequestsState {
  credentialRequests: {
    id: string,
    status: IssuedCredentialRequestStatus,
    request: CredentialRequest
  }[]
}

interface AddIssuedCredentialRequestPayload {
  id: string,
  request: CredentialRequest
}

interface ChangeIssuedCredentialRequestStatusPayload {
  id: string,
  status: IssuedCredentialRequestStatus
}

const initialState: IssuedCredentialRequestsState = {
  credentialRequests: []
}

const issuedCredentialRequestsSlice = createSlice({
  name: 'credentialRequests',
  initialState,
  reducers: {
    addIssuedCredentialRequest(state: IssuedCredentialRequestsState, { payload: { id, request } }: PayloadAction<AddIssuedCredentialRequestPayload>) {
      state.credentialRequests.push({
        id,
        request,
        status: IssuedCredentialRequestStatus.READY
      })
    },
    changeIssuedCredentialRequestStatusPayload(state: IssuedCredentialRequestsState, { payload: { id, status }}: PayloadAction<ChangeIssuedCredentialRequestStatusPayload>) {
      state.credentialRequests.find(request => request.id === id)?.status == status
    }
  }
})

export const { addIssuedCredentialRequest, changeIssuedCredentialRequestStatusPayload } = issuedCredentialRequestsSlice.actions

export const selectIssuedCredentialRequests = (state: IssuedCredentialRequestsState) => state.credentialRequests

export const selectIssuedCredentialReadyRequests = createSelector(
  [selectIssuedCredentialRequests],
  requests => requests.filter(request => request.status === IssuedCredentialRequestStatus.READY)
)

export const selectIssuedCredentialPendingRequests = createSelector(
  [selectIssuedCredentialRequests],
  requests => requests.filter(request => request.status === IssuedCredentialRequestStatus.PENDING)
)

export const selectIssuedCredentialSuccessRequests = createSelector(
  [selectIssuedCredentialRequests],
  requests => requests.filter(request => request.status === IssuedCredentialRequestStatus.SUCCESS)
)

export default issuedCredentialRequestsSlice.reducer
