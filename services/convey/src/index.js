const express = require('express')
const cors = require('cors')
const { loggerFactory } = require('@rsksmart/rif-node-utils')
const convey = require('./convey')

require('dotenv').config()

const env = {
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444',
  networkName: process.env.NETWORK_NAME || 'rsk:testnet',
  challengeExpirationInSeconds: process.env.CHALLENGE_EXPIRATION_SECONDS || 300,
  authExpirationInHours: process.env.AUTH_EXPIRATION_HOURS || 10,
  maxRequestsPerToken: process.env.MAX_REQUESTS_PER_TOKEN || 30,
  ipfsOptions: {
    host: process.env.IPFS_HOST,
    port: process.env.IPFS_PORT,
    protocol: 'http'
  }
}

const app = express()

app.use(cors())

const logger = loggerFactory({
  env: process.env.NODE_ENV || 'dev',
  infoFile: process.env.LOG_FILE || './log/convey.log',
  errorFile: process.env.LOG_ERROR_FILE || './log/convey.error.log'
})('rif-id:services:convey:script')

convey(app, env, logger, '')

const port = process.env.CONVEY_PORT || 5104

app.listen(port, () => logger.info(`Convey service service started on port ${port}`))
