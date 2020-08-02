const express = require('express')
const cors = require('cors')
const debug = require('debug')('rif-id:services:backoffice')

function backOffice(port, agent) {
  const app = express()
  app.use(cors())

  app.get('/identity', function(req, res) {
    debug('Identity requested')

    agent.identityManager.getIdentities()
      .then(identities => {
        if (!identities) return res.status(500).send('No identity')
        res.status(200).send(identities[0].did)
      })
  })

  app.listen(port, () => debug(`Back office service started on port ${port}`))
}

module.exports = backOffice
