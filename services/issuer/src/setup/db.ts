import { Entities, migrations } from '@veramo/data-store'
import { createConnection } from 'typeorm'

import CredentialRequest from '../lib/CredentialRequest'
import createLogger from '../lib/logger'

const logger = createLogger('rif-id:setup:db')

export default function setupDB(database) {
  const connection = createConnection({
    type: 'sqlite',
    database,
    synchronize: false,
    migrations,
    migrationsRun: true,
    entities: [...Entities, CredentialRequest],
  })

  logger.info('DB Connection established')

  return connection
}
