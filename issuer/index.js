require('dotenv').config()
const Debug = require('debug')
const debug = Debug('rif-id')

const setupDb = require('./setup/db')
const setupAgent = require('./setup/agent')
const setupIdentity = require('./setup/identity')

const { credentialRequestService } = require('./services/credentialRequests')

/* debugger from .env */
if (process.env.DEBUG) {
  Debug.enable(process.env.DEBUG)
}

async function main() {
  /* setup */
  const dbConnection = setupDb('./issuer.sqlite')
  const agent = setupAgent(dbConnection)
  const identity = await setupIdentity(agent)

  /* services */
  credentialRequestService()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    debug(err)
    process.exit(1)
  })
