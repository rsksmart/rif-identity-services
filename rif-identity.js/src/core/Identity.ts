import { Agent } from 'daf-core'
import { identityOperationsFactory } from '../operations'
import { selectIdentities } from '../selectors'

export class Identity {
  private store: any

  protected identityOperations: ReturnType<typeof identityOperationsFactory>

  public agent: Agent
  public dataVault: any

  constructor(agent: Agent, dataVault: any, store: any) {
    this.agent = agent
    this.dataVault = dataVault
    this.store = store

    this.identityOperations = identityOperationsFactory(this.agent)
  }

  protected get state() {
    return this.store.getState()
  }

  protected dispatch(action: any) {
    this.store.dispatch(action)
  }

  async init() {
    return this.identityOperations.initIdentity()(this.store.dispatch)
  }

  public get identities() {
    return selectIdentities(this.state)
  }

  public createIdentity() {
    return this.identityOperations.createIdentity()(this.store.dispatch)
  }
}
