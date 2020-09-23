import { getTestAgent, getTestSdrRequestData, getRandomString, getIdentity } from './utils'
import request from 'supertest'
import express from 'express'
import fs from 'fs'
import { keccak256 } from 'js-sha3'
import CredentialRequest from '../src/lib/CredentialRequest'
import credentialRequestService from '../src/services/credentialRequests'
import { verifyCredential } from 'did-jwt-vc'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
import backOffice from '../src/services/backOffice'
import { getLoginJwt } from 'vc-jwt-auth/lib/test-utils'

describe('should sync both services under the same thread of requests', () => {
  let 
    agent, connection, database, issuerDid, backOfficePassword, backOfficeApp, credRequestApp,
    sdr, sdrHash, backOfficeUsername = 'admin', sdrId, token
  
  beforeAll(async () => {
    // setup apps
    ({ agent, connection, database } = await getTestAgent())

    issuerDid = (await agent.identityManager.getIdentities())[0].did
    expect(issuerDid).toContain('rsk:testnet')

    backOfficePassword = getRandomString()

    backOfficeApp = express()
    await backOffice(backOfficeApp, agent, backOfficePassword)

    const identities = await agent.identityManager.getIdentities()
    const identity = identities[0]
    const env = {
      signer: (await identity.keyByType('Secp256k1')).signer(),
      did: identity.did
    }

    credRequestApp = express()
    await credentialRequestService(credRequestApp, agent, env)

  })

  afterAll(async () => {
    // close and delete DB after the test
    await connection.close()

    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(database, './artifacts')
    else fs.unlinkSync(database)
  })

  it('HOLDER logs in', async () => {
    const clientIdentity = await getIdentity()
    let body;

    ({ body } = await request(credRequestApp).post('/request-auth').send({ did: clientIdentity.did }).expect(200))

    const jwt = await getLoginJwt('challenge', body.challenge, clientIdentity);

    ({ body } = await request(credRequestApp).post('/auth').send({ jwt }).expect(200));

    ({ token } = body)
  })

  it('HOLDER requests for a credential', async () => {
    sdr = await getTestSdrRequestData()
    sdrHash = keccak256(sdr.body)

    const message = { body: sdr.body }
    const data = JSON.stringify(message)

    await request(credRequestApp).post('/requestCredential')
      .set('Content-Type', 'text/plain')
      .set('Authorization', token)
      .send(data).expect(200)

    // check that the request has been saved with pending status
    const retrieved = await connection.getRepository(CredentialRequest).find()

    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].hash).toEqual(sdrHash)
    expect(retrieved[0].status).toEqual('pending')
  })

  it('HOLDER requests for the credential that has not been granted yet', async () => {
    const { body } = await request(credRequestApp)
      .get(`/receiveCredential?hash=${sdrHash}`)
      .set('Authorization', token)
      .expect(200)

    expect(body.status).toEqual('PENDING')
    expect(body.payload.raw).toEqual(sdr.body)
  })

  it('ISSUER gets all the sdrs and should include the one just created', async () => {
    const { text } = await request(backOfficeApp).get('/requests').auth(backOfficeUsername, backOfficePassword).expect(200)
    
    const reqs = JSON.parse(text)

    expect(reqs).toHaveLength(1)
    expect(reqs[0].status).toEqual('pending')
    expect(reqs[0].from).toEqual(sdr.from)
    expect(reqs[0].fullName).toEqual(sdr.fullName)

    sdrId = reqs[0].id
  })

  it('ISSUER grants the SDR', async () => {
    const { text } = await request(backOfficeApp)
      .put(`/request/${sdrId}/status`).set('Content-Type', 'application/json')
      .auth(backOfficeUsername, backOfficePassword).send({ status: 'granted' }).expect(200)

    const updated = JSON.parse(text)

    expect(updated.id).toEqual(sdrId)
    expect(updated.status).toEqual('granted')
  })

  it('HOLDER requests for the credential and should receive the VC', async () => {
    const { body } = await request(credRequestApp)
      .get(`/receiveCredential?hash=${sdrHash}`)
      .set('Authorization', token)
      .expect(200)

    expect(body.status).toEqual('SUCCESS')

    const vcJwt = body.payload.raw
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

    const { payload, issuer } = await verifyCredential(vcJwt, didResolver)
    
    expect(issuer).toEqual(issuerDid)
    expect(payload.sub).toEqual(sdr.from)
    expect(payload.vc.credentialSubject.fullName).toEqual(sdr.fullName)
  })

})