import { Agent } from 'daf-core'
import { DafResolver } from 'daf-resolver'
import { IdentityProvider } from 'daf-ethr-did'
import { KeyStore, IdentityStore } from 'daf-local-storage'
import { KeyManagementSystem } from 'daf-libsodium'

import * as DidJwt from 'daf-did-jwt'
import * as W3c from 'daf-w3c'
import * as DIDComm from 'daf-did-comm'
import * as Sdr from 'daf-selective-disclosure'

import Debug from 'debug'
Debug.enable('*')

const keyStore = new KeyStore('localKeys')
const kms = new KeyManagementSystem(keyStore)
const identityStore = new IdentityStore('localIdentities')
const network = 'rsk:testnet'
const rpcUrl = 'https://did.testnet.rsk.co:4444'

const identityProvider = new IdentityProvider({
  kms,
  identityStore,
  network,
  rpcUrl,
})

const identityProviders = [identityProvider]

const serviceControllers: any = []

const didResolver = new DafResolver({ networks: [
  { name: "rsk:testnet", registry: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", rpcUrl },
]})

const messageHandler = new DIDComm.DIDCommMessageHandler()
messageHandler
  .setNext(new DidJwt.JwtMessageHandler())
  .setNext(new W3c.W3cMessageHandler())
  .setNext(new Sdr.SdrMessageHandler())

const actionHandler = new W3c.W3cActionHandler()
actionHandler
  .setNext(new Sdr.SdrActionHandler())
  .setNext(new DIDComm.DIDCommActionHandler())

export const agent = new Agent({
  identityProviders,
  serviceControllers,
  didResolver,
  messageHandler,
  actionHandler,
})
