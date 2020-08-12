/* env */
import dotenv from 'dotenv'
import Debug from 'debug'
import express from 'express'
import cors from 'cors'
import { setupCentralizedIPFSPinner } from '../../data-vault/build/services/centralizedIPFSPinner'

/* env */
dotenv.config()
Debug.enable('*')

const debug = Debug('rif-id:data-vault:scripts')

if (!process.env.DATA_VAULT_PRIVATE_KEY) throw new Error('Setup private key')
if (!process.env.DATA_VAULT_ADDRESS) throw new Error('Setup address')

const env = {
  privateKey: process.env.DATA_VAULT_PRIVATE_KEY,
  address: process.env.DATA_VAULT_ADDRESS,
  ipfsPort: process.env.DATA_VAULT_IPFS_PORT || '5001',
  authExpirationTime: process.env.DATA_VAULT_AUTH_EXPIRATION_TIME || '300000',
  rpcUrl: process.env.DATA_VAULT_RPC_URL || 'https://did.testnet.rsk.co:4444'
}

const port = process.env.PORT || 3300

/* setup app */
const app = express()
app.use(cors())

setupCentralizedIPFSPinner(app, env, '/data-vault').then(() => app.listen(port, () => {
  debug(`Data vault started on http://localhost:${port}/data-vault`)
}))
