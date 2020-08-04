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
 |                                            |  store { did, payload }
 | <------------- success/error ------------- |<--┘
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
 | <------------------ creds. --------------- |<--┘
```

Install:

```
npm i
```

Config: create a `.env` file with

```
PRIVATE_KEY= private key
ADDRESS= matching address
AUTH_EXPIRATION_TIME= fixed time for auth tokens to expire in
INFURA_KEY= infura key for rinkeby
PORT= to run the data vault
```

Run:

```
npm run start
```

Develop:

```
npm run dev
```
