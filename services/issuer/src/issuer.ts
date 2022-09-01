import createLogger from './lib/logger'

import setupDb from './setup/db'
import setupAgent from './setup/agent'
import setupIdentity from './setup/identity'

import credentialRequestService from './services/credentialRequests'
import backOffice from './services/backOffice'
import { rskDIDFromPrivateKey, rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

const logger = createLogger('rif-id:main')

logger.info('Setting up')

export async function runIssuer({
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
  maxRequestsPerToken,
  serviceUrl,
  challengeSecret,
  loginMessageHeader,
}) {
  const dbConnection = setupDb(database)
  const agent = setupAgent(dbConnection, secretBoxKey, rpcUrl, networkName)
  await setupIdentity(agent);

  const identities = await agent.didManagerFind()

  const identity = identities[0]

  const serviceIdentity = identity.did.includes('rsk:testnet') ? rskTestnetDIDFromPrivateKey()(secretBoxKey) : rskDIDFromPrivateKey()(secretBoxKey)
  const serviceDid = serviceIdentity.did

  console.log("did from rsk: ", serviceDid)
  console.log("did from uport: ", identity.did)

  const env = {
    challengeExpirationInSeconds,
    authExpirationInHours,
    maxRequestsPerToken,
    did: serviceDid,
    signer: serviceIdentity.signer,
    rpcUrl,
    networkName,
    serviceUrl,
    challengeSecret,
    loginMessageHeader,
  }

  logger.info('Setting up services')
  if (launchCredentialRequestService) await credentialRequestService(apps[0], agent, env, credentialRequestServicePrefix)
  if (launchBackOffice) backOffice(apps.length > 1 ? apps[1] : apps[0], agent, adminUser, adminPass, backOfficePrefix)
  logger.info('Services set up')
}
