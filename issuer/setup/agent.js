const { KeyStore, IdentityStore, Agent } = require('daf-core')
const { SecretBox, KeyManagementSystem } = require('daf-libsodium')
const { IdentityProvider } = require('daf-ethr-did')
const { DIDCommMessageHandler, DIDCommActionHandler } = require('daf-did-comm')
const { JwtMessageHandler } = require('daf-did-jwt')
const { W3cMessageHandler, W3cActionHandler } = require('daf-w3c')
const { DafResolver } = require('daf-resolver')
const debug = require('debug')('rif-id:setup:agent')

const infuraProjectId = process.env.INFURA_PROJECT_ID

function createIdentityProviders(dbConnection) {
  const secretBox = new SecretBox(process.env.SECRET_BOX_KEY)
  const keyStore = new KeyStore(dbConnection, secretBox)

  const kms = new KeyManagementSystem(keyStore)
  const identityStore = new IdentityStore('issuer-ethr', dbConnection)
  const network = 'rinkeby'
  const rpcUrl = 'https://rinkeby.infura.io/v3/' + infuraProjectId

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
  return new DafResolver({ infuraProjectId })
}

function createMessageHandler() {
  return new DIDCommMessageHandler()
    .setNext(new JwtMessageHandler())
    .setNext(new W3cMessageHandler())
}

function createActionHandler() {
  return new DIDCommActionHandler()
    .setNext(new W3cActionHandler)
}

function setupAgent(dbConnection) {
  const identityProviders = createIdentityProviders(dbConnection)
  const serviceControllers = createServiceControllers()
  const didResolver = createResolver()
  const messageHandler = createMessageHandler()
  const actionHandler = createActionHandler()

  const agent = new Agent({
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
