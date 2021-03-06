import dotenv from 'dotenv'
import createLogger from '../lib/logger'
import express from 'express'
import cors from 'cors'

import { runIssuer } from '../issuer'

const logger = createLogger('rif-id:main')
dotenv.config()

logger.info('Setting up')

async function main () {
  const appCredentialRequests = express()
  appCredentialRequests.use(cors())

  const appBackOffice = express()
  appBackOffice.use(cors())

  await runIssuer({
    secretBoxKey: process.env.SECRET_BOX_KEY,
    rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444',
    networkName: process.env.NETWORK_NAME || 'rsk:testnet',
    adminUser: process.env.ADMIN_USER,
    adminPass: process.env.ADMIN_PASS,
    apps: [appCredentialRequests, appBackOffice],
    backOfficePrefix: '',
    credentialRequestServicePrefix: '',
    launchCredentialRequestService: true,
    launchBackOffice: true,
    database: process.env.DB_FILE || './db/issuer.sqlite',
    challengeExpirationInSeconds: process.env.CHALLENGE_EXPIRATION_SECONDS || 300,
    authExpirationInHours: process.env.AUTH_EXPIRATION_HOURS || 10,
    maxRequestsPerToken: process.env.MAX_REQUESTS_PER_TOKEN || 30
  })

  const credentialRequestsPort = process.env.CREDENTIAL_REQUESTS_PORT || 5100
  const backOfficePort = process.env.REACT_APP_BACKOFFICE_PORT || 5200

  appCredentialRequests.listen(credentialRequestsPort, () => logger.info('Request credential service started at port ' + credentialRequestsPort))
  appBackOffice.listen(backOfficePort, () => logger.info('Back office service started at port ' + backOfficePort))
}

main().catch(e => { logger.error('Caught error', e); process.exit(1) })
