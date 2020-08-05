require('dotenv').config()
const tinyQr = require('./tinyQr')

tinyQr(process.env.TINY_QR_PORT, process.env.TINY_QR_URL)
