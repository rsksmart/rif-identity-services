import { loggerFactory } from '@rsksmart/rif-node-utils'
import dotenv from 'dotenv'

dotenv.config()

const ENV = process.env.NODE_ENV || 'dev'
const FILE = process.env.LOG_FILE || './log/issuer-backend.log'
const ERROR_FILE = process.env.LOG_ERROR_FILE || './log/issuer-backend.error.log'

export default loggerFactory({
  env: ENV,
  infoFile: FILE,
  errorFile: ERROR_FILE
})
