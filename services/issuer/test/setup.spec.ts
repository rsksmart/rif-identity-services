import { getRandomString, getTestAgent } from './utils'
import setupDB from '../src/setup/db'
import setupAgent from '../src/setup/agent'
import fs from 'fs'
import { SecretBox } from 'daf-libsodium'
import setupIdentity from '../src/setup/identity'


describe('setup tests', () => {
  let database

  afterEach(() => {
    if (process.env.CI === 'true' && process.env.CIRCLECI === 'true') fs.copyFileSync(database, './artifacts')
    else fs.unlinkSync(database)
  })

  it('setup db should return a sqlite connection', async () => {
    database = `${getRandomString()}.sqlite`
    const connection = await setupDB(database)

    expect(connection).toBeTruthy()
    expect(connection.driver.database).toEqual(database)
    expect(connection.options.type).toEqual('sqlite')

    await connection.close()
  })

  it('setup agent should return a DAF agent with no identities', async () => {
    database = `${getRandomString()}.sqlite`
    const connection = await setupDB(database)

    const secretBoxKey = await SecretBox.createSecretKey()
    const rpcUrl = 'https://did.testnet.rsk.co:4444'

    const agent = setupAgent(connection, secretBoxKey, rpcUrl, 'rsk:testnet')
    const identities = await agent.identityManager.getIdentities()

    expect(agent).toBeTruthy()
    expect(identities).toHaveLength(0)
    expect(agent.dbConnection).toEqual(connection)

    await connection.close()
  })

  it('setup identity should set an rsk did based identity', async () => {
    let agent, connection;

    ({ database, agent, connection } = await getTestAgent(false))

    await setupIdentity(agent)

    const identities = await agent.identityManager.getIdentities()

    expect(identities).toHaveLength(1)
    expect(identities[0].did).toContain('rsk:testnet')
  
    await connection.close()    
  })
})
