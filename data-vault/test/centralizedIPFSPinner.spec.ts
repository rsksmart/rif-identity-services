import request from 'supertest';
import express, { Express } from 'express'
import { setupCentralizedIPFSPinner } from '../src/services/centralizedIPFSPinner'
import { rskDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'

describe('Express app tests', () => {
  let app: Express, did: string;

  beforeAll(async () => {
    const mnemonic = generateMnemonic(12)
    const seed = await mnemonicToSeed(mnemonic)
    const hdKey = seedToRSKHDKey(seed)
    const privateKey = hdKey.derive(0).privateKey!.toString('hex')
    did = rskDIDFromPrivateKey()(privateKey).did;

    const env = {
      privateKey: 'c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083',
      address: '0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8',
      ipfsPort: process.env.IPFS_PORT || '5001',
      ipfsHost: process.env.IPFS_HOST || 'localhost',
      authExpirationTime: process.env.AUTH_EXPIRATION_TIME || '300000',
      rpcUrl: process.env.RPC_URL || 'https://did.testnet.rsk.co:4444'
    }
    
    app = express()
    
    await setupCentralizedIPFSPinner(app, env)

  })
  
  describe('POST /auth', () => {
    it('returns a valid JWT', async () => {
      const { text } = await request(app).post('/auth').send({ did }).expect(200)

      expect(text).toBeTruthy()
      expect(text.split('.').length).toBe(3)
      
    })
  })
})