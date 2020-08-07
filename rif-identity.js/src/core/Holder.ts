import { Agent } from 'daf-core'
import { Identity } from './Identity'
import { configureHolderStore } from '../store/holder'

export class Holder extends Identity {
  constructor(agent: Agent, dataVault: any) {
    const store = configureHolderStore()
    super(agent, dataVault, store)
  }
}
