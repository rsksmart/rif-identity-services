import createLogger from '../lib/logger'

const logger = createLogger('rif-id:main')

export default async function setupIdentity(agent) {
  const identities = await agent.identityManager.getIdentities()

  logger.info(`Identity count: ${identities.length}`)

  const identity = identities.length === 0
   ?  await agent.identityManager.createIdentity()
   : identities[0]

  logger.info(`Identity: ${identity.did}`)
}
