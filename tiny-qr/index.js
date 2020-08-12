require('dotenv').config()
const tinyQr = require('./tinyQr')

tinyQr(process.env.TINY_QR_PORT || 5103, process.env.TINY_QR_URL || 'http://localhost:5103')
