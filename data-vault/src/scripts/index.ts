/* env */
import dotenv from 'dotenv'
import Debug from 'debug'
import express from 'express'
import cors from 'cors'
import { setupCentralizedIPFSPinner } from '../services/centralizedIPFSPinner'

/* env */
dotenv.config()
Debug.enable('*')

const debug = Debug('rif-id:data-vault:scripts')

if (!process.env.PRIVATE_KEY) throw new Error('Setup private key')
if (!process.env.ADDRESS) throw new Error('Setup address')

const env = {
  privateKey: process.env.PRIVATE_KEY,
  address: process.env.ADDRESS,
  ipfsPort: process.env.IPFS_PORT || '5001',
  authExpirationTime: process.env.AUTH_EXPIRATION_TIME || '300000',
  rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444'
}

const port = process.env.PORT || '5102'

/* setup app */
const app = express()
app.use(cors())

setupCentralizedIPFSPinner(app, env).then(() => app.listen(port, () => debug(`Data vault started on port ${port}`)))
