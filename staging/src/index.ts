/* env */
import dotenv from 'dotenv'
import Debug from 'debug'
import express from 'express'
import cors from 'cors'
import { setupCentralizedIPFSPinner } from '../../data-vault/build/services/centralizedIPFSPinner'
import { runIssuer } from '../../issuer/server/build/issuer'
const tinyQr = require('../../tiny-qr/tinyQr')

/* env */
dotenv.config()
Debug.enable('*')

const debug = Debug('rif-id:staging')

if (!process.env.DATA_VAULT_PRIVATE_KEY) throw new Error('Setup private key')
if (!process.env.DATA_VAULT_ADDRESS) throw new Error('Setup address')

if (!process.env.ISSUER_ADMIN_PASS) throw new Error('Setup issuer back office password')
if (!process.env.ISSUER_SECRET_BOX_KEY) throw new Error('Setup issuer secret box key')


const port = process.env.PORT || 3300

/* setup app */
const app = express()
app.use(cors())

const dataVaultOptions = {
  privateKey: process.env.DATA_VAULT_PRIVATE_KEY,
  address: process.env.DATA_VAULT_ADDRESS,
  ipfsPort: process.env.DATA_VAULT_IPFS_PORT || '5001',
  authExpirationTime: process.env.DATA_VAULT_AUTH_EXPIRATION_TIME || '300000',
  rpcUrl: process.env.DATA_VAULT_RPC_URL || 'https://did.testnet.rsk.co:4444'
}

const issuerOptions = {
  secretBoxKey: process.env.ISSUER_SECRET_BOX_KEY,
  adminPass: process.env.ISSUER_ADMIN_PASS,
  rpcUrl: process.env.ISSUER_RPC_URL || 'https://did.testnet.rsk.co:4444',
  debuggerOptions: '*',
  apps: [app],
  backOfficePrefix: '/issuer-back-office',
  credentialRequestServicePrefix: '/issuer-credential-requests'
}

const tinyQrOptions = process.env.TINY_QR_URL

setupCentralizedIPFSPinner(app, dataVaultOptions, '/data-vault')
  .then(() => tinyQr(app, tinyQrOptions, '/tiny-qr'))
  .then(() => runIssuer(issuerOptions))
  .then(() => app.listen(port, () => {
    debug(`Data vault started on http://localhost:${port}/data-vault`)
    debug(`Back office service started on http://localhost:${port}'/issuer-back-office'`)
    debug(`Credential request service started on http://localhost:${port}/issuer-credential-requests`)
    debug(`Tiny QR started on http://localhost:${port}/tiny-qr`)
  }))
