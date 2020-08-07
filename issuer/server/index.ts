import dotenv from 'dotenv'
import Debug from 'debug'

import setupDb from './setup/db'
import setupAgent from './setup/agent'
import setupIdentity from './setup/identity'

import credentialRequestService from './services/credentialRequests'
import backOffice from './services/backOffice'

const debug = Debug('rif-id:main')
dotenv.config()

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

  debug('Services started')
  debug('Requests at port' + process.env.CREDENTIAL_REQUESTS_PORT)
  debug('Back office at port' + process.env.REACT_APP_BACKOFFICE_PORT)
}

main().catch(e => { debug(e); process.exit(1) })