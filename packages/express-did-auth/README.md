<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>@rsksmart/express-w3c-auth</code></h3>
<p align="middle">
    Express middleware to authenticate users using DIDs and VCs
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%express-did-auth">
        <img src="https://badge.fury.io/js/%40rsksmart%express-did-auth.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/express-did-auth
```

This package exposes a set of functions to authenticate users using [DIDs](https://w3c.github.io/did-core/) and [Verifiable Credentials](https://w3c.github.io/vc-data-model/) in an Express.js server.

The specification of this modules is in [this article](https://github.com/rsksmart/rif-identity-docs/blob/master/ssi/specs/did-auth.markdown). This modules is a WIP.

## How it works

1. User sends him/her DID and asks for a challenge.
2. The package generates it and associate the just generated challenge with the received DID. The challenge will be valid for a fixed time. Default: 5 minutes
3. The user signs a VC that includes the challenge in it and sends its JWT representation to the package.
4. The package validates that the VC is signed by the private key associated with the previous sent DID and that it contains the previous sent challenge. If it is ok, it generates another VC and returns its JWT representation. Default expiration time: 10 hours.
5. The user sends that received JWT in the `Authorization` header of each authenticated request.
6. The package provides a middleware that can be used in [Express](https://expressjs.com/) applications, it validates the sent JWT, if it is okay, it authenticates the request, if not, 401 is returned.

## Operations

### `initializeAuth`

The library must be initialized with this method. If not, an exception will be thrown when invoking the rest of the methods. It configures the library with the sent options and initializes the identity that will sign the authentication JWTs.

```typescript
import { initializeAuth } from '@rsksmart/express-did-auth'

initializeAuth(env)
```

`env` is an `object` that contains the following keys:
- `did: string` (REQUIRED) - did that will be used to sign auth tokens
- `signer: Signer` (REQUIRED) - [`Signer`](https://github.com/decentralized-identity/did-jwt/blob/master/src/JWT.ts#L6) object associated with the did, will be used to sign auth tokens.
- `rpcUrl: string`, `networkName: string` and `registry: string`: rpc url, network name, and registry contract address used to validate Ethr DIDs - Default supports rsk testnet and rsk mainnet
- `authExpirationInHours: number` - Default: 10
- `challengeExpirationInSeconds: number` - Default: 300
- `maxRequestsPerToken: number` - Default: 20

### `getChallenge`

Generates a random 64 bytes challenge that will be validated when the user logs in. The challenge will be deleted after the `challengeExpirationInSeconds` value provided in the `initializeAuth` method.

```typescript
import { getChallenge } from '@rsksmart/express-did-auth'

function requestAuth(req, res) {
  const { did } = req.body

  logger.info(`${did} requested auth`)

  const challenge = getChallenge(did)

  res.status(200).send({ challenge })
}


app.post('/request-auth', bodyParser.json(), requestAuth)
```

`did` is a `string`, the DID that will be associated with the generated challenge.

### `getAuthToken`

Generates the JWT representation of a VC that will be used to authenticate requests from now onward. Throws errors if the challenge is not valid or the VC received is not well formatted. The generated JWT will be deleted after the `authExpirationInHours` value provided in the `initializeAuth` method.

```typescript
function auth(req, res) {
  const { jwt } = req.body

  getAuthToken(jwt)
    .then(token => res.status(200).send({ token }))
    .catch(err => res.status(401).send(err.message))
}

app.post('/auth', bodyParser.json(), auth)
```

`jwt` is `string` representing a JSON Web Token of a VC signed by the client with the received challenge. That VC should be signed by the DID sent before and follow this format:

```js
{
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential'],
  credentialSubject: {
    claims: [
      { claimType: 'challenge', claimValue: RECEIVED_CHALLENGE }
    ]
  }
}
```

### `authExpressMiddleware`

It is a middleware created to be used in Express applications. The `token` should be included raw in the `Authorization` header of the request. This method validates that that token has been signed by the `privateKey` provided in the `initializeAuth` method, that it is not expired and also that the `token` did not exceed the max amount of requests allowed per user (`maxRequestsPerToken`)

```typescript
import { authExpressMiddleware } from '@rsksmart/express-w3c-auth'

app.use(authExpressMiddleware)
```

## Run for development and test

```
npm i
npm test
```

### Link to other project

```
npm link
cd path/to/your/project
npm link @rsksmart/rif-id-jwt-auth
```
