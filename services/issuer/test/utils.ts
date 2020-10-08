import { Agent } from 'daf-core'
import setupDB from '../src/setup/db'
import { SecretBox } from 'daf-libsodium'
import setupAgent from '../src/setup/agent'
import { Connection } from 'typeorm'
import setupIdentity from '../src/setup/identity'
import { mnemonicToSeed, seedToRSKHDKey, generateMnemonic } from '@rsksmart/rif-id-mnemonic'
import { createJWT } from 'did-jwt';
import { rskTestnetDIDFromPrivateKey } from '@rsksmart/rif-id-ethr-did'

// return an 8 characters random string
export const getRandomString = (): string => Math.random().toString(36).substring(3, 11)

export const getTestAgent = async (setIdentity = true, db?: string): Promise<{ 
  database: string, agent: Agent, connection: Connection
}> => {
  const database = db || `${getRandomString()}.sqlite`
  const connectionPromise = setupDB(database)

  const secretBoxKey = await SecretBox.createSecretKey()
  const rpcUrl = 'https://did.testnet.rsk.co:4444'

  const agent = setupAgent(connectionPromise, secretBoxKey, rpcUrl, 'rsk:testnet')

  if (setIdentity) {
    await setupIdentity(agent)
  }

  const connection = await connectionPromise

  return { database, agent, connection }
}

export const getIdentity = async () => {
  const mnemonic = generateMnemonic(12)
  const seed = await mnemonicToSeed(mnemonic)
  const hdKey = seedToRSKHDKey(seed)
  const privateKey = hdKey.derive(0).privateKey!.toString('hex')

  return rskTestnetDIDFromPrivateKey()(privateKey)
}

export const getTestSdrRequestData = async () => {
  const { did, signer } = await getIdentity()

  const fullName = getRandomString()

  const sdrData = {
    iss: did,
    claims: [
      { claimType: 'type', claimValue: getRandomString() },
      { claimType: 'credentialRequest', claimValue: 'cred1' },
      { claimType: 'fullName', claimValue: fullName },
      { claimType: getRandomString(), claimValue: getRandomString() },
      { claimType: getRandomString(), claimValue: getRandomString() },
      { claimType: getRandomString(), claimValue: getRandomString() }
    ],
    credentials: [],
  };
  
  const jwt = await createJWT(
    { type: 'sdr', ...sdrData },
    { issuer: did, alg: 'ES256K-R', signer }
  )

  const data = { from: did, body: jwt, fullName }

  return data
}
