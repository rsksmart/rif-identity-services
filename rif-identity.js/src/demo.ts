require('dotenv').config()

import { createConnection } from 'typeorm'
import { Entities } from 'daf-core'
import Debug from 'debug'

import { setupAgent } from './agent/node'
import { Identity, Issuer, Holder } from './core'

const debug = Debug('rif-id:demo')
Debug.enable('rif-id:*')

const issuerDatabase = process.env.ISSUER_DATABASE as string
const holderDatabase = process.env.HOLDER_DATABASE as string
const secretBoxKey = process.env.SECRET_BOX_KEY as string
const infuraProjectId = process.env.INFURA_PROJECT_ID as string

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

const issuerAgent = setupAgent(secretBoxKey, infuraProjectId, issuerDbConnection)
const holderAgent = setupAgent(secretBoxKey, infuraProjectId, holderDbConnection)

const issuer = new Issuer(issuerAgent, {})
const holder = new Holder(holderAgent, {})

async function createIfNoIdentity(identity: Identity) {
  if (!identity.identities.length) {
    await identity.createIdentity()
  }
}

async function main() {
  await issuer.init()

  if (!issuer.identities.length) {
    await issuer.createIdentity()
  }

  await createIfNoIdentity(issuer)
  await createIfNoIdentity(holder)

  debug('Issuer identity: ' + issuer.identities[0])
  debug('Holder identity: ' + holder.identities[0])
}

main().catch(e => { console.error(e), process.exit(1) })
