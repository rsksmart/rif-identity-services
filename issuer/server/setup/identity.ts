import Debug from 'debug'

const debug = Debug('rif-id:setup:identity')

export default async function setupIdentity(agent) {
  const identities = await agent.identityManager.getIdentities()

  debug(`Identity count: ${identities.length}`)

  const identity = identities.length === 0
   ?  await agent.identityManager.createIdentity()
   : identities[0]

  debug(`Identity: ${identity.did}`)
}
