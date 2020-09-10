import { messageToRequest } from '../lib/messageToRequest'
import { getRandomString } from './utils'

describe('messageToRequest tests', () => {
  const fullName = getRandomString()
  const type = getRandomString()
  const sdr = [
    { claimType: getRandomString(), claimValue: getRandomString() },
    { claimType: getRandomString(), claimValue: getRandomString() },
    { claimType: getRandomString(), claimValue: getRandomString() },
    { claimType: 'fullName', claimValue: fullName }
  ]

  const iss = 'issuer'
  const status = 'pending'
  const id = '123456'
  const validCredentialRequest = {
    id,
    status,
    message: {
      metaData: [{ type: 'JWT', value: 'ES256K-R' }],
      data: {
        iss,
        claims: [
          { claimType: 'credentialRequest', claimValue: 'cred1' },
          { claimType: 'type', claimValue: type },
          ...sdr,
        ]
      }
    }
  }

  it('maps a message to a request succesfully', () => {
    const request = messageToRequest(validCredentialRequest)

    expect(request.sdr).toEqual(sdr)
    expect(request.from).toEqual(iss)
    expect(request.fullName).toEqual(fullName)
    expect(request.type).toEqual(type)
    expect(request.status).toEqual(status)
    expect(request.isValid).toBeTruthy()
    expect(request.id).toEqual(id)
  })

  describe('expect error when invalid fields', () => {
    let credentialRequest

    it('empty credRequest', () => {
      credentialRequest = {}
    })

    it('empty iss', () => {
      credentialRequest = {
        ...validCredentialRequest
      }

      delete credentialRequest.message.data['iss']
    })

    it('empty fullName', () => {
      credentialRequest = {
        ...validCredentialRequest
      }

      credentialRequest.message.data.claims = credentialRequest.message.data.claims.filter(
        claim => claim.claimType !== 'fullName'
      )
    })

    it('empty sdr', () => {
      credentialRequest = {
        ...validCredentialRequest
      }

      credentialRequest.message.data.claims = credentialRequest.message.data.claims.filter(
        claim => claim.claimType === 'credentialRequest' || claim.claimType === 'type'
      )
    })

    afterEach(() => {
      try {
        messageToRequest(credentialRequest)
        throw new Error('An error was expected')
      } catch (err) {
        expect(err.message).toEqual('Invalid request')
      }
    })
  })
  
})
