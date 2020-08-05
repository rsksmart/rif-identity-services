require('dotenv').config()
const Debug = require('debug')

const setupDb = require('./setup/db')
const setupAgent = require('./setup/agent')
const setupIdentity = require('./setup/identity')

const credentialRequestService = require('./services/credentialRequests')
const backOffice = require('./services/backOffice')
const tinyQr = require('./services/tinyQr')

const debug = Debug('rif-id:main')


/* debugger from .env */
if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

debug('Setting up')

async function main () {
  const dbConnection = setupDb('./issuer.sqlite')
  const agent = setupAgent(dbConnection)
  await setupIdentity(agent)

  debug('Set up')

  debug('Starting services')

  credentialRequestService(process.env.CREDENTIAL_REQUESTS_PORT, agent)
  backOffice(process.env.REACT_APP_BACKOFFICE_PORT, agent)
  tinyQr(process.env.TINY_QR_PORT, process.env.TINY_QR_URL)

  debug('Services started')
}

main().catch(e => { debug(e); process.exit(1) })