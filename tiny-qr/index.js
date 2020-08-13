const express = require('express')
const cors = require('cors')
const Debug = require('debug')
const tinyQr = require('./tinyQr')

require('dotenv').config()

Debug.enable('*')
const debug = Debug('rif-id:services:tiny-qr:script')

const app = express()
app.use(cors())

tinyQr(app, process.env.TINY_QR_URL || 'http://localhost:5103', '')

const port = process.env.TINY_QR_PORT || 5103
app.listen(port, () => debug(`Tiny QR service started on port ${port}`))
