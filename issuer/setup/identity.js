const debug = require('debug')('rif-id:setup:identity')

async function setupIdentity(agent) {
  const identities = await agent.identityManager.getIdentities()

  debug(`Identity count: ${identities.length}`)

  const identity = identities.length === 0
   ?  await agent.identityManager.createIdentity()
   : identities[0]

   debug(`Identity: ${identity.did}`)

   return identity
}

module.exports = setupIdentity
