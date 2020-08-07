import { Agent } from 'daf-core'
import { operationsFactory } from '../operations'
import { selectIdentities } from '../selectors'

export class Identity {
  protected agent: Agent
  protected operations: ReturnType<typeof operationsFactory>

  public store: any
  public dataVault: any

  constructor(agent: Agent, dataVault: any, store: any) {
    this.agent = agent
    this.dataVault = dataVault
    this.store = store

    this.operations = operationsFactory(this.agent)
  }

  protected get state() {
    return this.store.getState()
  }

  async init() {
    return this.operations.initIdentity()(this.store.dispatch)
  }

  get identities() {
    return selectIdentities(this.state)
  }

  public createIdentity() {
    return this.operations.createIdentity()(this.store.dispatch)
  }
}
