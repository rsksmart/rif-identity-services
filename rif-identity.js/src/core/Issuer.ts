import { Agent } from 'daf-core'
import { Identity } from './Identity'
import { configureIssuerStore, IssuerStore } from '../store/issuer'

export class Issuer extends Identity {
  constructor(agent: Agent, dataVault: any) {
    const store = configureIssuerStore()
    super(agent, dataVault, store)
  }
}
