import * as Daf from 'daf-core'
import { W3cActionHandler, W3cMessageHandler } from 'daf-w3c'
import { JwtMessageHandler } from 'daf-did-jwt'
import { DafResolver } from 'daf-resolver'
import * as EthrDid from 'daf-ethr-did'
import * as DafLocalStorage from 'daf-local-storage'
import * as DafLibSodium from 'daf-libsodium'

import Debug from 'debug'
Debug.enable('*')

const messageHandler = new JwtMessageHandler()
messageHandler.setNext(new W3cMessageHandler())

const actionHandler = new W3cActionHandler()

const infuraProjectId = '5ffc47f65c4042ce847ef66a3fa70d4c'

const didResolver = new DafResolver({ infuraProjectId })

const identityProviders: Daf.AbstractIdentityProvider[] = [
  new EthrDid.IdentityProvider({
    kms: new DafLibSodium.KeyManagementSystem(new DafLocalStorage.KeyStore('localKeys')),
    identityStore: new DafLocalStorage.IdentityStore('localIdentities'),
    network: 'rinkeby',
    rpcUrl: 'https://rinkeby.infura.io/v3/' + infuraProjectId,
  }),
]

export const agent = new Daf.Agent({
  identityProviders,
  serviceControllers: [],
  didResolver,
  messageHandler,
  actionHandler,
})
