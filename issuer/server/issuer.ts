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
  adminPass,
  apps,
  credentialRequestServicePrefix,
  backOfficePrefix,
  launchCredentialRequestService,
  launchBackOffice,
  database,
  challengeExpirationInSeconds,
  authExpirationInHours,
  maxRequestsPerToken,
  address,
  privateKey
}) {
  const dbConnection = setupDb(database)
  const agent = setupAgent(dbConnection, secretBoxKey, rpcUrl)
  await setupIdentity(agent);

  const env = {
    challengeExpirationInSeconds,
    authExpirationInHours,
    maxRequestsPerToken,
    address,
    privateKey,
  }

  logger.info('Setting up services')
  if (launchCredentialRequestService) credentialRequestService(apps[0], agent, env, credentialRequestServicePrefix)
  if (launchBackOffice) backOffice(apps.length > 1 ? apps[1] : apps[0], agent, adminPass, backOfficePrefix)
  logger.info('Services set up')
}
