# RIF Identity Authentication

This package exposes a set of functions to authenticate users using [DIDs](https://w3c.github.io/did-core/) and [Verifiable Credentials](https://w3c.github.io/vc-data-model/)

## How it works

1. User sends him/her DID and asks for a challenge.
2. The package generates it and associate the just generated challenge with the received DID. The challenge will be valid for a fixed time. Default: 5 minutes
3. The user signs a VC that includes the challenge in it and sends its JWT representation to the package.
4. The package validates that the VC is signed by the private key associated with the previous sent DID and that it contains the previous sent challenge. If it is ok, it generates another VC and returns its JWT representation. Default expiration time: 10 hours.
5. The user sends that received JWT in the `Authorization` header of each authenticated request.
6. The package provides a middleware that can be used in [Express](https://expressjs.com/) applications, it validates the sent JWT, if it is okay, it authenticates the request, if not, 401 is returned.

## Operations

### initializeAuth

The library must be initialized with this method. If not, an exception will be thrown when invoking the rest of the methods. It configures the library with the sent options and initializes the identity that will sign the authentication JWTs.


#### Parameter
- `env`
Is an `object` that contains the following:
-- `privateKey` - key that will be used to sign auth tokens. REQUIRED
-- `rpcUrl`: rsk rpc url used to validate credentials - Default: `https://did.testnet.rsk.co:4444`
-- `authExpirationInHours` - Default: 10
-- `challengeExpirationInSeconds` - Default: 300
-- `maxRequestsPerToken` - Default: 20

### getChallenge

Generates a random 64 bytes challenge that will be validated when the user logs in. The challenge will be deleted after the `challengeExpirationInSeconds` value provided in the `initializeAuth` method.

#### Parameter
- `did` - `string` DID that will be associated with the generated challenge. REQUIRED

### getAuthToken

Generates the JWT representation of a VC that will be used to authenticate requests from now onward. Throws errors if the challenge is not valid or the VC received is not well formatted. The generated JWT will be deleted after the `authExpirationInHours` value provided in the `initializeAuth` method.

#### Parameter
- `jwt` - `jwt` representation of a VC signed by the client with the received challenge. That VC should be signed by the DID sent before and follow this format:
```
vc: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    credentialSubject: {
      claims: [
        { claimType: 'challenge', claimValue: RECEIVED_CHALLENGE }
      ]
    }
  }
```

### authExpressMiddleware

It is a middleware created to be used in Express applications. The `token` should be included raw in the `Authorization` header of the request. This method validates that that token has been signed by the `privateKey` provided in the `initializeAuth` method, that it is not expired and also that the `token` did not exceed the max amount of requests allowed per user (`maxRequestsPerToken`)


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