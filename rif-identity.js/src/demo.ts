require('dotenv').config()

import { createConnection } from 'typeorm'
import { Entities } from 'daf-core'
import Debug from 'debug'

import { setupAgent } from './agent/node'
import { Identity, Issuer, Holder } from './core'
import { dlCredentialRequestDiscriminator } from './credentials/driverLicense'

const debug = Debug('rif-id:demo')
Debug.enable('*')

const issuerDatabase = process.env.ISSUER_DATABASE as string
const holderDatabase = process.env.HOLDER_DATABASE as string
const secretBoxKey = process.env.SECRET_BOX_KEY as string

const issuerDbConnection = createConnection({
  type: 'sqlite',
  database: issuerDatabase,
  synchronize: true,
  logging: false,
  entities: Entities,
})

const holderDbConnection = createConnection({
  type: 'sqlite',
  database: holderDatabase,
  synchronize: true,
  logging: false,
  entities: Entities,
})


const issuerAgent = setupAgent(secretBoxKey, issuerDbConnection)
const holderAgent = setupAgent(secretBoxKey, holderDbConnection)

const issuer = new Issuer(issuerAgent, {})
const holder = new Holder(holderAgent, {})

async function createIfNoIdentity(identity: Identity) {
  if (!identity.identities.length) {
    await identity.createIdentity()
  }
}

async function main() {
  await issuer.init()
  await holder.init()

  await createIfNoIdentity(issuer)
  await createIfNoIdentity(holder)

  debug('Issuer identity: ' + issuer.identities[0])
  debug('Holder identity: ' + holder.identities[0])

  const request = await holder.requestCredential({
    type: dlCredentialRequestDiscriminator,
    subject: holder.identities[0],
    issuer: issuer.identities[0],
    fullName: 'Charly Garcia',
    city: 'Buenos Aires',
  }, 'http://localhost:20202/')
}

main().catch(e => { console.error(e), process.exit(1) })
