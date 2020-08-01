const express = require('express')
const bodyParser = require('body-parser')

const credentialRequestService = () => {
  const app = express()

  app.post('/requestCredential', bodyParser.json(), function(req, res) {
    console.log(req.body)
  })

  const PORT = 3000

  app.listen(PORT, () => console.log(`Issuer app started on port ${PORT}`))
}

module.exports = {
  credentialRequestService
}
