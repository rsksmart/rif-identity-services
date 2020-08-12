import dotenv from 'dotenv'
import Debug from 'debug'

import { runIssuer } from './issuer'

const debug = Debug('rif-id:main')
dotenv.config()

debug('Setting up')

async function main () {
  await runIssuer({
    secretBoxKey: process.env.SECRET_BOX_KEY,
    rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444',
    credentialRequestsPort: process.env.CREDENTIAL_REQUESTS_PORT || '5100',
    backOfficePort: process.env.REACT_APP_BACKOFFICE_PORT || '5101',
    debuggerOptions: process.env.DEBUG,
    adminPass: process.env.ADMIN_PASS
  })
}

main().catch(e => { debug(e); process.exit(1) })
