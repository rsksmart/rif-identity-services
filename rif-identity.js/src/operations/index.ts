import { Agent } from "daf-core";
import { initIdentityFactory, createIdentityFactory } from './identity'

export const operationsFactory = (agent: Agent) => {
  const initIdentity = initIdentityFactory(agent)
  const createIdentity = createIdentityFactory(agent)

  return Object.freeze({
    initIdentity,
    createIdentity
  })
}
