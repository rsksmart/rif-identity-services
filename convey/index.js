const express = require('express')
const cors = require('cors')
const convey = require('./convey')
const createLogger = require('./logger')
require('dotenv').config()

const logger = createLogger('rif-id:services:convey:script')


const app = express()
app.use(cors())

const ipfsOptions = {
  host: process.env.IPFS_HOST,
  port: process.env.IPFS_PORT,
  protocol: 'http' 
}

convey(app, ipfsOptions, '')

const port = process.env.CONVEY_PORT || 5104
app.listen(port, () => logger.info(`Convey service service started on port ${port}`))
