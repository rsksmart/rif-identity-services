import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { IdentityProvider } from 'daf-ethr-did'
import { DafResolver } from 'daf-resolver'

import * as DIDComm from 'daf-did-comm'
import * as DidJwt from 'daf-did-jwt'
import * as W3c from 'daf-w3c'
import * as Sdr from 'daf-selective-disclosure'
import createLogger from '../lib/logger'
import { Resolver } from 'did-resolver'

const logger = createLogger('rif-id:setup:agent')

function createIdentityProviders(dbConnection, secretBoxKey ,rpcUrl, networkName) {
  const secretBox = new SecretBox(secretBoxKey)
  const keyStore = new KeyStore(dbConnection, secretBox)

  const kms = new KeyManagementSystem(keyStore)
  const identityStore = new IdentityStore('issuer-ethr', dbConnection)
  const network = 'rsk:testnet'

  const identityProvider = new IdentityProvider({
    kms,
    identityStore,
    network: networkName,
    rpcUrl
  })

  return [identityProvider]
}

function createServiceControllers() {
  return []
}

function createResolver(rpcUrl, networkName) {
  return new DafResolver({ networks: [
    { name: networkName, registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl },
  ]})
}

function createMessageHandler() {
  const messageHandler = new DIDComm.DIDCommMessageHandler()
  messageHandler
    .setNext(new DidJwt.JwtMessageHandler())
    .setNext(new W3c.W3cMessageHandler())
    .setNext(new Sdr.SdrMessageHandler())
  return messageHandler
}

function createActionHandler() {
  const actionHandler = new W3c.W3cActionHandler()
  actionHandler
    .setNext(new Sdr.SdrActionHandler())
    .setNext(new DIDComm.DIDCommActionHandler())
  return actionHandler
}

export default function setupAgent(dbConnection, secreBoxKey, rpcUrl, networkName) {
  const identityProviders = createIdentityProviders(dbConnection, secreBoxKey, rpcUrl, networkName)
  const serviceControllers = createServiceControllers()
  const didResolver = createResolver(rpcUrl, networkName)
  const messageHandler = createMessageHandler()
  const actionHandler = createActionHandler()

  const agent = new Agent({
    dbConnection,
    identityProviders,
    serviceControllers,
    didResolver: (didResolver as unknown as Resolver),
    messageHandler,
    actionHandler
  })

  logger.info('Agent created')

  return agent
}