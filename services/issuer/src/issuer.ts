import createLogger from './lib/logger'

import setupDb from './setup/db'
import setupAgent from './setup/agent'
import setupIdentity from './setup/identity'

import credentialRequestService from './services/credentialRequests'
import backOffice from './services/backOffice'

const logger = createLogger('rif-id:main')

logger.info('Setting up')

export async function runIssuer ({
  secretBoxKey,
  rpcUrl,
  networkName,
  adminUser,
  adminPass,
  apps,
  credentialRequestServicePrefix,
  backOfficePrefix,
  launchCredentialRequestService,
  launchBackOffice,
  database,
  challengeExpirationInSeconds,
  authExpirationInHours,
  maxRequestsPerToken
}) {
  const dbConnection = setupDb(database)
  const agent = setupAgent(dbConnection, secretBoxKey, rpcUrl, networkName)
  await setupIdentity(agent);

  const identities = await agent.identityManager.getIdentities()
  const identity = identities[0]

  const env = {
    challengeExpirationInSeconds,
    authExpirationInHours,
    maxRequestsPerToken,
    signer: (await identity.keyByType('Secp256k1')).signer(),
    did: identity.did,
    rpcUrl,
    networkName
  }

  logger.info('Setting up services')
  if (launchCredentialRequestService) credentialRequestService(apps[0], agent, env, credentialRequestServicePrefix)
  if (launchBackOffice) backOffice(apps.length > 1 ? apps[1] : apps[0], agent, adminUser, adminPass, backOfficePrefix)
  logger.info('Services set up')
}
