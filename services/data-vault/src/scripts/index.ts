import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { loggerFactory } from '@rsksmart/rif-node-utils'
import { setupCentralizedIPFSPinner } from '../services/centralizedIPFSPinner'

dotenv.config()

if (!process.env.PRIVATE_KEY) throw new Error('Setup private key')
if (!process.env.ADDRESS) throw new Error('Setup address')

const env = {
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS,
  ipfsPort: process.env.IPFS_PORT || '5001',
  ipfsHost: process.env.IPFS_HOST || 'localhost',
  authExpirationTime: process.env.AUTH_EXPIRATION_TIME || '300000',
  rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444',
  dbFile: process.env.DATABASE_FILE || './db/data-vault-mapper.sqlite'
}

const port = process.env.PORT || '5102'

const logger = loggerFactory({
  env: process.env.NODE_ENV || 'dev',
  infoFile: process.env.LOG_FILE || './log/data-vault.log',
  errorFile: process.env.LOG_ERROR_FILE || './log/data-vault.error.log'
})('rif-id:data-vault')

/* setup app */
const app = express()
app.use(cors())

setupCentralizedIPFSPinner(app, env, logger)
  .then(() => app.listen(port, () => logger.info(`Data vault started on port ${port}`)))
  .catch(e => logger.error('Caught error', e))
