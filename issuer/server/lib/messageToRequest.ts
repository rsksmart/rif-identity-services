export function messageToRequest(credentialRequest) {
  let request
  const message = credentialRequest.message

  if (message.data.claims.find(c => c.claimType === 'credentialRequest' && c.claimValue === 'cred1')) {
    const from = message.data.iss
    const name = message.data.claims.find(c => c.claimType === 'name').claimValue
    const sdr = message.data.claims.filter(c => c.claimType !== 'credentialRequest')
    const isValid = message.metaData.indexOf({ type: 'JWT', value: 'ES256K-R' })
    const status = credentialRequest.status
    const id = credentialRequest.id

    if (from || name || sdr.length === 0) request = { from, name, sdr, isValid, status, id }
  }

  if (!request) throw new Error('Invalid request')

  return request
}

