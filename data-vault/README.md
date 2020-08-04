# Data vault

A data vault first approach

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
 |                                            |  store { did, cid }
 | <------------------ cid -------------- |<--┘
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
 |                                            |  retrieve { did }
 | <----------------- cids ------------------ |<--┘
```

1. Install deps

  ```
  npm i
  ```

2. Install IPFS CLI. Find your option: http://localhost:8080/ipns/docs.ipfs.io/how-to/command-line-quick-start/#install-ipfs

3. Start IPFS Daemon

  ```
  ipfs daemon
  ```

  > Ensure it is running on port 5001

4. Configure: create a `.env` file with

  ```
  PRIVATE_KEY= private key
  ADDRESS= matching address
  AUTH_EXPIRATION_TIME= fixed time for auth tokens to expire in
  INFURA_KEY= infura key for rinkeby
  PORT= to run the data vault
  IPFS_PORT= port of a local http IPFS gateway
  ```

5. Start data-vault:

  ```
  npm run dev
  ```

  > Use `npm run start` for no `nodemon`
