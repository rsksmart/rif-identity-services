require('dotenv').config()
const setupDb = require('./setup/db')
const setupAgent = require('./setup/agent')
const Debug = require('debug')

if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

const { credentialRequestService } = require('./services/credentialRequests')

const dbConnection = setupDb('./issuer.sqlite')
const agent = setupAgent(dbConnection)

credentialRequestService()
