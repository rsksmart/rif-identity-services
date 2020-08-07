import { Connection } from 'typeorm'
import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
import { IdentityProvider } from 'daf-ethr-did'
import { DafResolver } from 'daf-resolver'

import * as DIDComm from 'daf-did-comm'
import * as DidJwt from 'daf-did-jwt'
import * as W3c from 'daf-w3c'
import * as Sdr from 'daf-selective-disclosure'

import Debug from 'debug'

const debug = Debug('rif-id:setup:agent')

const rskTestnetRpcUrl = "https://did.testnet.rsk.co:4444"

function createIdentityProviders(secretBoxKey: string, dbConnection: Promise<Connection>) {
  const secretBox = new SecretBox(secretBoxKey)
  const keyStore = new KeyStore(dbConnection, secretBox)

  const kms = new KeyManagementSystem(keyStore)
  const identityStore = new IdentityStore('issuer-ethr', dbConnection)
  const network = 'rsk:testnet'
  const rpcUrl = rskTestnetRpcUrl

  const identityProvider = new IdentityProvider({
    kms,
    identityStore,
    network,
    rpcUrl
  })

  return [identityProvider]
}

function createServiceControllers() {
  return []
}

function createResolver() {
  return new DafResolver({ networks: [
    { name: "rsk:testnet", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl: rskTestnetRpcUrl },
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

export function setupAgent(secretBoxKey: string, dbConnection: Promise<Connection>) {
  const identityProviders = createIdentityProviders(secretBoxKey, dbConnection)
  const serviceControllers = createServiceControllers()
  const didResolver = createResolver()
  const messageHandler = createMessageHandler()
  const actionHandler = createActionHandler()

  const agent = new Agent({
    dbConnection,
    identityProviders,
    serviceControllers,
    didResolver,
    messageHandler,
    actionHandler
  })

  debug('Agent created')

  return agent
}
