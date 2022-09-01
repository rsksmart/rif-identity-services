import createLogger from '../lib/logger'
import { IssuerAgent } from './agent'

const logger = createLogger('rif-id:identity')

export default async function setupIdentity(agent: IssuerAgent) {
  const identities = await agent.didManagerFind()

  logger.info(`Identity count: ${identities.length}`)

  const identity = identities.length === 0
   ?  await await agent.didManagerCreate()
   : identities[0]

  logger.info(`Identity: ${identity.did}`)
}
