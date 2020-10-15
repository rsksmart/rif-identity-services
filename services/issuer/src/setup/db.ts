import { createConnection } from 'typeorm'
import { Entities } from 'daf-core'
import CredentialRequest from '../lib/CredentialRequest'
import createLogger from '../lib/logger'

const logger = createLogger('rif-id:setup:db')

export default function setupDB(database) {
  const connection = createConnection({
    type: 'sqlite',
    database,
    synchronize: true,
    logging: false,
    entities: [...Entities, CredentialRequest],
  })

  logger.info('DB Connection established')

  return connection
}
