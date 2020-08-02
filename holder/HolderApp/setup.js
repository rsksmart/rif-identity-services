import { createConnection } from 'typeorm'
import * as Daf from 'daf-core'
import { KeyManagementSystem } from 'daf-react-native-libsodium'
import { DafResolver } from 'daf-resolver'
import { IdentityProvider } from 'daf-ethr-did'

import * as DidJwt from 'daf-did-jwt'
import * as W3c from 'daf-w3c'
import * as DIDComm from 'daf-did-comm'

import Debug from 'debug'

const infuraProjectId = '5ffc47f65c4042ce847ef66a3fa70d4c'

Debug.enable('*')

const dbConnection = createConnection({
  type: 'react-native',
  database: 'daf',
  location: './issuerDB',
  logging: ['error'],
  synchronize: true,
  entities: [...Daf.Entities],
})

const keyStore = new Daf.KeyStore(dbConnection)
const kms = new KeyManagementSystem(keyStore)
const identityStore = new Daf.IdentityStore('rinkeby', dbConnection)

const didResolver = new DafResolver({ infuraProjectId })
const rinkebyIdentityProvider = new IdentityProvider({
  kms,
  identityStore,
  network: 'rinkeby',
  rpcUrl: 'https://rinkeby.infura.io/v3/' + infuraProjectId,
})

const identityProviders = [rinkebyIdentityProvider]

const messageHandler = new DIDComm.DIDCommMessageHandler()
  .setNext(new DidJwt.JwtMessageHandler())
  .setNext(new W3c.W3cMessageHandler())

const actionHandler = new DIDComm.DIDCommActionHandler()
actionHandler
  .setNext(new W3c.W3cActionHandler())

export const agent = new Daf.Agent({
  dbConnection,
  didResolver,
  identityProviders,
  actionHandler,
  messageHandler,
})

console.log('------------- Agent created -------------')
