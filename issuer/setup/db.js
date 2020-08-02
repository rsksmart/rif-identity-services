const { createConnection } = require('typeorm')
const { Entities } = require('daf-core')
const debug = require('debug')('rif-id:setup:db')

function setupDB(database) {
  const connection = createConnection({
    type: 'sqlite',
    database,
    synchronize: true,
    logging: false,
    entities: Entities,
  })

  debug('DB Connection established')

  return connection
}

module.exports = setupDB
