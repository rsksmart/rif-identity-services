const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc')

const getLoginJwt = async (claimType, claimValue, identity) => createVerifiableCredentialJwt({
  vc: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    credentialSubject: {
      claims: [
        { claimType, claimValue }
      ]
    }
  }
}, identity)

module.exports = { getLoginJwt }
