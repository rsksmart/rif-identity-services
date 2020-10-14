import { getRandomString, getTestAgent, getTestSdrRequestData } from './utils'
import request from 'supertest'
import express, { Express } from 'express'
import { Agent } from 'daf-core'
import { Connection } from 'typeorm'
import fs from 'fs'
import backOffice from '../src/services/backOffice'
import { keccak256 } from 'js-sha3'
import CredentialRequest from '../src/lib/CredentialRequest'

describe('backOfficeService tests', () => {
  let 
    app: Express, agent: Agent, connection: Connection,
    database: string, user: string, password: string, issuerDid: string

  const generateAndSaveSdr = async () => {
    const sdr = await getTestSdrRequestData()

    const message = await agent.handleMessage({ raw: sdr.body, metaData: [] })
    const hash = (keccak256(message.raw) as any).toString('hex')
    const credRequest = { status: 'pending', message, hash }

    const createdRequest = await connection.getRepository(CredentialRequest).save(credRequest)

    return { sdr, createdRequest }
  }

  beforeEach(async () => {
    ({ agent, connection, database } = await getTestAgent())

    issuerDid = (await agent.identityManager.getIdentities())[0].did
    expect(issuerDid).toContain('rsk:testnet')

    user = getRandomString()
    password = getRandomString()
    app = express()

    await backOffice(app, agent, user, password)
  })

  afterEach(async () => {
    await connection.close()

    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(database, './artifacts')
    else fs.unlinkSync(database)
  })

  describe('POST /auth', () => {
    it('should return 200 if valid user & pwd', async () => {
      await request(app).post('/auth').auth(user, password).expect(200)
    })

    it('should return 401 if invalid pwd', async () => {
      await request(app).post('/auth').auth(user, 'invalid').expect(401)
    })

    it('should return 401 if invalid user', async () => {
      await request(app).post('/auth').auth('invalid', password).expect(401)
    })
  })

  describe('GET /identity', () => {
    it('should return 401 if no auth sent', async () => {
      await request(app).get('/identity').expect(401)
    })

    it('should return current identity', async () => {
      const { text } = await request(app).get('/identity').auth(user, password).expect(200)

      expect(text).toEqual(issuerDid)
    })

    it('should throw 500 if no identity set', async () => {
      // close the connection generated in the beforeEach statement
      await connection.close();

      ({ agent, connection } = await getTestAgent(false, database))
      await backOffice(app, agent, user, password)

      await request(app).get('/identity').auth(user, password).expect(500)
    })
  })

  describe('GET /__health', () => {
    it('should return a 200 with no auth required', async () => {
      await request(app).get('/__health').expect(200)
    })
  })

  describe('GET /requests', () => {
    it('should return 401 if no auth sent', async () => {
      await request(app).get('/requests').expect(401)
    })

    it('should return empty list if no requests', async () => {
      const { text } = await request(app).get('/requests').auth(user, password).expect(200)
      
      const reqs = JSON.parse(text)

      expect(reqs).toHaveLength(0)
    })

    it('should return created sdr', async () => {
      const { sdr } = await generateAndSaveSdr()
      const { from, fullName } = sdr

      const { text } = await request(app).get('/requests').auth(user, password).expect(200)
      
      const reqs = JSON.parse(text)

      expect(reqs).toHaveLength(1)
      expect(reqs[0].status).toEqual('pending')
      expect(reqs[0].from).toEqual(from)
      expect(reqs[0].fullName).toEqual(fullName)
    })
  })

  describe('PUT /request/:id/status', () => {
    let path, createdRequest
    
    beforeEach(async () => {
      ({ createdRequest } = await generateAndSaveSdr())
      
      path = `/request/${createdRequest.id}/status`
    })
  
    it('should return 401 if no auth sent', async () => {
      await request(app).put(path).expect(401)
    })

    it('should return 400 if invalid status', async () => {
        const status = getRandomString()

        const { text } = await request(app)
          .put(path).set('Content-Type', 'application/json')
          .auth(user, password).send({ status }).expect(400)

        expect(text).toEqual('Invalid action')
    })

    describe
      .each([['granted'], ['denied']])
      ('should update the status', (status) => {
        it('should update the credential request status', async () => {
          const { text } = await request(app)
            .put(path).set('Content-Type', 'application/json')
            .auth(user, password).send({ status }).expect(200)

          const updated = JSON.parse(text)

          expect(updated.id).toEqual(createdRequest.id)
          expect(updated.status).toEqual(status)

          // verify that the db is updated as well
          const retrieved = await connection.getRepository(CredentialRequest).findOneOrFail({ id: updated.id })
          expect(retrieved.status).toEqual(status)
      })
    })
  })
})
