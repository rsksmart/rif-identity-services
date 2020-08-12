import dotenv from 'dotenv'
import Debug from 'debug'

import setupDb from './setup/db'
import setupAgent from './setup/agent'
import setupIdentity from './setup/identity'

import credentialRequestService from './services/credentialRequests'
import backOffice from './services/backOffice'

import { runIssuer } from './issuer'

const debug = Debug('rif-id:main')
dotenv.config()

debug('Setting up')

export async function runIssuer ({
  secretBoxKey,
  rpcUrl,
  credentialRequestsPort,
  backOfficePort,
  debuggerOptions,
  adminPass
}) {
  /* debugger from .env */
  if (debuggerOptions) {
    Debug.enable(debuggerOptions)
  }

  const dbConnection = setupDb('./issuer.sqlite')
  const agent = setupAgent(dbConnection, secretBoxKey, rpcUrl)
  await setupIdentity(agent)

  debug('Set up')

  debug('Starting services')

  credentialRequestService(credentialRequestsPort, agent)
  backOffice(backOfficePort, agent, adminPass)

  debug('Services started')
  debug('Requests at port' + credentialRequestsPort)
  debug('Back office at port' + backOfficePort)
}
