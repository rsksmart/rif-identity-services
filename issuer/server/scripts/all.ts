import dotenv from 'dotenv'
import Debug from 'debug'
import express from 'express'
import cors from 'cors'

import { runIssuer } from '../issuer'

const debug = Debug('rif-id:main')
dotenv.config()

debug('Setting up')

async function main () {
  const appCredentialRequests = express()
  appCredentialRequests.use(cors())

  const appBackOffice = express()
  appBackOffice.use(cors())

  await runIssuer({
    secretBoxKey: process.env.SECRET_BOX_KEY,
    rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444',
    debuggerOptions: process.env.DEBUG,
    adminPass: process.env.ADMIN_PASS,
    apps: [appCredentialRequests, appBackOffice],
    backOfficePrefix: '',
    credentialRequestServicePrefix: '',
    launchCredentialRequestService: true,
    launchBackOffice: true,
    database: './issuer.sqlite'
  })

  const credentialRequestsPort = process.env.CREDENTIAL_REQUESTS_PORT || 5100
  const backOfficePort = process.env.REACT_APP_BACKOFFICE_PORT || 5200

  appCredentialRequests.listen(credentialRequestsPort, () => debug('Request credential service started at port' + credentialRequestsPort))
  appBackOffice.listen(backOfficePort, () => debug('Back office service started at port' + backOfficePort))
}

main().catch(e => { debug(e); process.exit(1) })
