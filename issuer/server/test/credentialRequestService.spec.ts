import { getTestAgent, getTestSdrRequestData, getIdentity } from './utils'
import request from 'supertest'
import express, { Express } from 'express'
import { Agent } from 'daf-core'
import { Connection } from 'typeorm'
import fs from 'fs'
import { keccak256 } from 'js-sha3'
import CredentialRequest from '../lib/CredentialRequest'
import credentialRequestService from '../services/credentialRequests'
import { verifyCredential } from 'did-jwt-vc'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
import { Signer } from 'did-jwt'
import { getLoginJwt } from 'vc-jwt-auth/lib/test-utils'

interface TestIdentity { did: string, signer: Signer}

describe('credentialRequestService tests', () => {
  let 
    app: Express, agent: Agent, connection: Connection, database: string,
    clientIdentity: TestIdentity, env: TestIdentity

  const providerConfig = {
    networks: [
      { 
        name: 'rsk:testnet',
        registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
        rpcUrl: 'https://did.testnet.rsk.co:4444'
      }
    ]
  }
  const ethrDidResolver = getResolver(providerConfig)
  const didResolver = new Resolver(ethrDidResolver)

  beforeEach(async () => {
    ({ agent, connection, database } = await getTestAgent())

    app = express()
    
    const identities = await agent.identityManager.getIdentities()
    const identity = identities[0]
    env = {
      signer: (await identity.keyByType('Secp256k1')).signer(),
      did: identity.did
    }

    clientIdentity = await getIdentity()

    await credentialRequestService(app, agent, env)
  })

  afterEach(async () => {
    await connection.close()

    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(database, './artifacts')
    else fs.unlinkSync(database)
  })

  describe('auth', () => {
    it('returns a challenge when requesting it', async () => {
      const { body } = await request(app).post('/request-auth').send({ did: clientIdentity.did }).expect(200)

      expect(body.challenge).toBeTruthy()
    })

    it('returns a 500 if not did present', async () => {
      request(app).post('/request-auth').send().expect(200)
    })

    it('returns a valid token if sending the proper challenge', async () => {
      const did = clientIdentity.did
      let body;

      ({ body } = await request(app).post('/request-auth').send({ did }).expect(200))

      const jwt = await getLoginJwt('challenge', body.challenge, clientIdentity);

      ({ body } = await request(app).post('/auth').send({ jwt }).expect(200))

      const { issuer, payload } = await verifyCredential(body.token, didResolver)
      const expectedIssuerDid = env.did

      expect(payload.sub).toEqual(clientIdentity.did)
      expect(issuer).toContain(expectedIssuerDid)
    })
  })

  describe('authenticated requests', () => {
    let token

    beforeEach(async () => {
      const did = clientIdentity.did
      let body;

      ({ body } = await request(app).post('/request-auth').send({ did }).expect(200))

      const jwt = await getLoginJwt('challenge', body.challenge, clientIdentity);

      ({ body } = await request(app).post('/auth').send({ jwt }).expect(200));

      ({ token } = body)
    })

    describe('POST /requestCredential', () => {
      const path = '/requestCredential'

      it('should return 401 if not authenticated', async () => {
        const { body } = await getTestSdrRequestData()
        const message = { body }
        const data = JSON.stringify(message)

        await request(app).post(path)
          .set('Content-Type', 'text/plain')
          .send(data).expect(401)
      })

      it('should save a credential request and return 200', async () => {
        const { body } = await getTestSdrRequestData()
        const message = { body }
        const data = JSON.stringify(message)

        await request(app).post(path)
          .set('Content-Type', 'text/plain')
          .set('Authorization', token)
          .send(data).expect(200)

        // check that the request has been saved with pending status
        const retrieved = await connection.getRepository(CredentialRequest).find()

        expect(retrieved).toHaveLength(1)
        expect(retrieved[0].hash).toEqual(keccak256(body))
        expect(retrieved[0].status).toEqual('pending')
      })

      it('should return a 500 if invalid sdr', async () => {
        const message = { body: 'invalidSdr' }
        const data = JSON.stringify(message)

        await request(app).post(path)
          .set('Content-Type', 'text/plain')
          .set('Authorization', token)
          .send(data).expect(500)
      })
    })

    describe('GET /receiveCredential', () => {
      const path = '/receiveCredential'
      let hash, sdr

      const updateCredentialRequestStatus = async (hash: string, status: string) => {
        const credRequest = await connection.getRepository(CredentialRequest).findOne({
          where: { hash },
          relations: ['message']
        })

        credRequest.status = status
        return connection.getRepository(CredentialRequest).save(credRequest)
      }

      beforeEach(async () => {
        sdr = await getTestSdrRequestData()
        const message = { body: sdr.body }
        const data = JSON.stringify(message)

        await request(app).post('/requestCredential')
          .set('Content-Type', 'text/plain')
          .set('Authorization', token)
          .send(data).expect(200)

        hash = keccak256(sdr.body)
      })

      it('should return 401 if not authenticated', async () => {
        await request(app).get(`${path}?hash=${hash}`).expect(401)
      })

      describe
        .each([['issued'], ['denied'], ['pending']])
        ('should get the status of the request when the VC will not be emmited', (status) => {
          it(status, async () => {
            if (status !== 'pending') {
              await updateCredentialRequestStatus(hash, status)
            }

            const { body } = await request(app)
              .get(`${path}?hash=${hash}`)
              .set('Authorization', token)
              .expect(200)

            expect(body.status).toEqual(status.toUpperCase())
            expect(body.payload.raw).toEqual(sdr.body)
          })
        })

      // it('should get the VC if the request has been granted', async () => {
      //   await updateCredentialRequestStatus(hash, 'granted')

      //   const { body } = await request(app)
      //     .get(`${path}?hash=${hash}`)
      //     .set('Authorization', token)
      //     .expect(200)

      //   expect(body.status).toEqual('SUCCESS')

      //   const vcJwt = body.payload.raw

      //   const { payload, issuer } = await verifyCredential(vcJwt, didResolver)
        
      //   const issuerDid = (await agent.identityManager.getIdentities())[0].did
      //   expect(issuer).toEqual(issuerDid)
      //   expect(payload.sub).toEqual(sdr.from)
      //   expect(payload.vc.credentialSubject.fullName).toEqual(sdr.fullName)

      //   // check that the request has been saved with issued status
      //   const retrieved = await connection.getRepository(CredentialRequest).find()

      //   expect(retrieved).toHaveLength(1)
      //   expect(retrieved[0].hash).toEqual(hash)
      //   expect(retrieved[0].status).toEqual('issued')
      // })
    })
  })

  describe('GET /__health', () => {
    it('should return a 200', async () => {
      await request(app).get('/__health').expect(200)
    })
  })
})
