import { createConnection } from 'typeorm'
import { Entities } from 'daf-core'
import Debug from 'debug'
import CredentialRequest from '../lib/CredentialRequest'

const debug = Debug('rif-id:setup:db')

export default function setupDB(database) {
  const connection = createConnection({
    type: 'sqlite',
    database,
    synchronize: true,
    logging: false,
    entities: [...Entities, CredentialRequest],
  })

  debug('DB Connection established')

  return connection
}
