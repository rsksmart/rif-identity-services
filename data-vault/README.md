# Data vault

A data vault first approach. This service uses an IPFS node to pin files.

Alert: anyone in possession of a DID can used the server to upload files, now it has now file-size restrictions

```
User                                     Data Vault
 |                 Store cred.                |
 |                                            |
 | ----------- POST /auth { did } ----------> |---┐
 |                                            |  resolves did
 | <--------------- jwt(token) -------------- |<--┘
 |                                            |
 | -- POST /save jwt(payload, did, token) --> |---┐
 |                                            |  verify jwt
 |                                            |  verify token
 |                                            |  ipfs put payload
 |                                            |  ipfs pin cid
 |                                            |  store db { did, cid }
 | <------------------ cid ------------------ |<--┘
 |                                            |
 |                                            |
 |               Recover creds.               |
 |                                            |
 | ----------- POST /auth { did } ----------> |---┐
 |                                            |  resolves did
 | <--------------- jwt(token) -------------- |<--┘
 |                                            |
 | ----- POST /recover jwt(did, token) -----> |---┐
 |                                            |  verify jwt
 |                                            |  verify token
 |                                            |  retrieve db { did }
 | <----------------- cids ------------------ |<--┘
```

After the _store_ process the holder can verify the file was uploaded accessing to IPFS. When a recovery is required, the server will response all the CIDs of the files that were ever stored by the DID, the DID holder can then retrieve the files from IPFS. To maintain this flow a local DB maps DIDs to CIDs.

## Run

1. Install deps

  ```
  npm i
  ```

  `postinstall` is running a script to append `"rsk:testnet"` to `"did:ethr:"` methods name

  To do it manually, remove `postinstall` script before running installing, then find this in `node_modules/ethr-did/lib//index.js`

  ![fix](./img/fix.png)

2. Install IPFS CLI. Find your option: https://docs.ipfs.io/how-to/command-line-quick-start/.

3. Init IPFS

  ```
  ipfs init
  ```

4. Start IPFS Daemon

  ```
  ipfs daemon
  ```

5. Configure: create a `.env` file with

  ```
  PRIVATE_KEY= private key
  ADDRESS= matching address
  ```

  Optional parameters

  ```
  AUTH_EXPIRATION_TIME= fixed time for auth tokens to expire in
  RPC_URL= rsk testnet rpc url
  PORT= to run the data vault
  IPFS_PORT= port of an http IPFS gateway
  IPFS_HOST=host of an IPFS gateway - should be used if running with Docker
  DATABASE_FILE=relative path of the sqlite database
  LOG_FILE=relative path of the log file
  NODE_ENV=dev or production environment, used for logging purposes
  ```

  Example

  ```
  PRIVATE_KEY=c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083
  ADDRESS=0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8
  AUTH_EXPIRATION_TIME=300000
  RPC_URL=https://did.testnet.rsk.co:4444
  PORT=5102
  IPFS_PORT=5001
  IPFS_HOST=rif-identity-ipfs-testnet
  DATABASE_FILE=./data-vault-mapper.sqlite
  LOG_FILE=./data-vault.log
  NODE_ENV=production
  ```

  Defaults

  ```
  AUTH_EXPIRATION_TIME=300000
  RPC_URL=https://did.testnet.rsk.co:4444
  PORT=5102
  IPFS_PORT=5001
  IPFS_HOST=localhost
  DATABASE_FILE=./data-vault-mapper.sqlite
  LOG_FILE=./data-vault.log
  NODE_ENV=dev
  ```

6. In another terminal, start data-vault:

  ```
  npm run start
  # or npm run start:dev
  ```

  > Use `npm run start` for no `nodemon`

You should now see

![dv](dv.png)

## Test

1. Install deps

  ```
  npm i
  ```

  `postinstall` is running a script to append `"rsk:testnet"` to `"did:ethr:"` methods name

  To do it manually, remove `postinstall` script before running installing, then find this in `node_modules/ethr-did/lib//index.js`

  ![fix](./img/fix.png)

2. Install IPFS CLI. Find your option: https://docs.ipfs.io/how-to/command-line-quick-start/.

3. Init IPFS

  ```
  ipfs init
  ```

4. Start IPFS Daemon

  ```
  ipfs daemon
  ```

5. Run tests

  ```
  npm test
  ```