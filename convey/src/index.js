const express = require('express')
const cors = require('cors')
const convey = require('./convey')
const createLogger = require('./logger')
require('dotenv').config()

const logger = createLogger('rif-id:services:convey:script')

const app = express()
app.use(cors())

const env = {
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS,
  challengeExpirationInSeconds: process.env.CHALLENGE_EXPIRATION_SECONDS || 300,
  authExpirationInHours: process.env.AUTH_EXPIRATION_HOURS || 10,
  maxRequestsPerToken: process.env.MAX_REQUESTS_PER_TOKEN || 30,
  ipfsOptions: {
    host: process.env.IPFS_HOST,
    port: process.env.IPFS_PORT,
    protocol: 'http'
  }
}

convey(app, env, '')

const port = process.env.CONVEY_PORT || 5104
app.listen(port, () => logger.info(`Convey service service started on port ${port}`))
