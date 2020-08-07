import { RootIdentityState } from '../store/identity'

export const selectIdentitiesReducer = (state: RootIdentityState) => state.identity
