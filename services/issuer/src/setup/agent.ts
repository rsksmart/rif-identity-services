import createLogger from '../lib/logger'
import { Resolver } from 'did-resolver'
import { KeyManager } from '@veramo/key-manager'

import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { createAgent, IDataStore, IDIDManager, IKeyManager, IResolver, TAgent } from '@veramo/core';
import { DIDStore, IDataStoreORM, KeyStore, PrivateKeyStore } from '@veramo/data-store'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { DIDManager } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { Connection } from 'typeorm';
import { JsonRpcProvider } from '@ethersproject/providers';

const logger = createLogger('rif-id:setup:agent')


export default function setupAgent(dbConnection: Promise<Connection>, secretBoxKey: string, rpcUrl: string, networkName: string): TAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver> {
  logger.info("👀")
  try {
    const agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver>({
      plugins: [
        setupKeyManagerPlugin(dbConnection, secretBoxKey),
        setupDidManagerPlugin(dbConnection, networkName, rpcUrl),
        setupDIDResolverPlugin(rpcUrl, networkName),
      ],
    });
    logger.info('Agent created')
    return agent;
  }
  catch(err) {
    logger.error(err)
    logger.error(console.trace());
    throw err
  }
  
}
function setupDIDResolverPlugin(rpcUrl: string, networkName: string) {
  return new DIDResolverPlugin({
    resolver: new Resolver({
      ...ethrDidResolver({ rpcUrl, networkName })
    }),
  });
}

function setupDidManagerPlugin(dbConnection: Promise<Connection>, networkName: string, rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  return new DIDManager({
    store: new DIDStore(dbConnection),
    defaultProvider: 'did:ethr:rskTestnet',
    providers: {
      'did:ethr:rskTestnet': new EthrDIDProvider({
        defaultKms: 'local',
        network: networkName,
        web3Provider: provider,
      })
    },
  });
}

function setupKeyManagerPlugin(dbConnection: Promise<Connection>, secretBoxKey: string) {
  return new KeyManager({
    store: new KeyStore(dbConnection),
    kms: {
      local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(secretBoxKey))),
    },
  });
}

