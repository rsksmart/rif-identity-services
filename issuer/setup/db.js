const { createConnection } = require('typeorm')
const { Entities } = require('daf-core')
const debug = require('debug')('rif-id:setup:db')

function setupDB(database) {
  return createConnection({
    type: 'sqlite',
    database,
    synchronize: true,
    logging: false,
    entities: Entities,
  }).then(connection => {
    debug(`DB Connection: ${connection.name}`)
    return connection
  })
}

module.exports = setupDB
