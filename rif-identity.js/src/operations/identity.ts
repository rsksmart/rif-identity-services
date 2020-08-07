import { Agent } from "daf-core";
import { Dispatch } from "@reduxjs/toolkit"
import { addIdentity } from '../reducer/identityReducer'

export const initIdentityFactory = (agent: Agent) => () => (dispatch: Dispatch) => agent.identityManager.getIdentities()
  .then(identities => {
    identities.forEach(({ did }) => dispatch(addIdentity({ did })))
    return identities
  })

export const createIdentityFactory = (agent: Agent) => () => (dispatch: Dispatch) => agent.identityManager.createIdentity()
  .then(identity => {
    dispatch(addIdentity({ did: identity.did }))
    return identity
  })
