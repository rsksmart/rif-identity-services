function messageToRequest(message) {
  let request

  if (message.data.claims.find(c => c.claimType === 'credentialRequest' && c.claimValue === 'cred1')) {
    const from = message.data.iss
    const name = message.data.claims.find(c => c.claimType === 'name').claimValue
    const sdr = message.data.claims.filter(c => c.claimType !== 'credentialRequest')
    const isValid = message.metaData.indexOf({ type: 'JWT', value: 'ES256K-R' })

    if (from || name || sdr.length === 0) request = { from, name, sdr, isValid }
  }

  if (!request) throw new Error('Invalid request')

  return request
}

module.exports = { messageToRequest }
