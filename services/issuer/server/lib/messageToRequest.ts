export function messageToRequest(credentialRequest) {
  let request

  if (!credentialRequest || !credentialRequest.message) throw new Error('Invalid request')

  const message = credentialRequest.message

  if (message.data.claims.find(c => c.claimType === 'credentialRequest' && c.claimValue === 'cred1')) {
    const from = message.data.iss
    const fullName = message.data.claims.find(c => c.claimType === 'fullName')?.claimValue
    const type = message.data.claims.find(c => c.claimType === 'type')?.claimValue
    const sdr = message.data.claims.filter(c => c.claimType !== 'credentialRequest' && c.claimType !== 'type')
    const isValid = message.metaData.indexOf({ type: 'JWT', value: 'ES256K-R' })
    const status = credentialRequest.status
    const id = credentialRequest.id

    if (from && fullName && sdr.length > 0) request = { from, fullName, type, sdr, isValid, status, id }
  }

  if (!request) throw new Error('Invalid request')

  return request
}

