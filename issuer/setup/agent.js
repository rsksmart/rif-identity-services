const { KeyStore, IdentityStore, Agent } = require('daf-core')
const { SecretBox, KeyManagementSystem } = require('daf-libsodium')
const { IdentityProvider } = require('daf-ethr-did')
const { DafResolver } = require('daf-resolver')

const DIDComm = require('daf-did-comm')
const DidJwt = require('daf-did-jwt')
const W3c = require('daf-w3c')
const Sdr = require('daf-selective-disclosure')

const debug = require('debug')('rif-id:setup:agent')

const rpcUrl = process.env.RPC_URL

function createIdentityProviders(dbConnection) {
  const secretBox = new SecretBox(process.env.SECRET_BOX_KEY)
  const keyStore = new KeyStore(dbConnection, secretBox)

  const kms = new KeyManagementSystem(keyStore)
  const identityStore = new IdentityStore('issuer-ethr', dbConnection)
  const network = 'rsk:testnet'

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
    { name: "rsk:testnet", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl },
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

function setupAgent(dbConnection) {
  const identityProviders = createIdentityProviders(dbConnection)
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

module.exports = setupAgent
