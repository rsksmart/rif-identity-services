import winston, { format, transports } from 'winston'
import dotenv from 'dotenv'

dotenv.config()

const ENV = process.env.NODE_ENV || 'dev' 
const FILE = process.env.LOG_FILE || './log/issuer-backend.log' 
const ERROR_FILE = process.env.LOG_ERROR_FILE || './log/issuer-backend.error.log' 

const fileFormat = format.printf(
  ({ timestamp, level, label, message }) => `${timestamp} [${label}] ${level.toUpperCase()} ${message}`
)

const fileErrorFormat = format.printf(
  ({ timestamp, stack, label }) => `${timestamp} [${label}] ${stack}`
)

export default (label: string) => {
  const logger = winston.createLogger({
    transports: [
      new transports.File({
        filename: FILE,
        level: 'info',
        format: format.combine(
          format.label({ label }),
          format.timestamp(),
          fileFormat
        )
      }),
      new transports.File({
        filename: ERROR_FILE,
        level: 'error',
        format: format.combine(
          format.label({ label }),
          format.timestamp(),
          format.errors({ stack: true }),
          fileErrorFormat
        )
      }),
    ],
  });

  if (ENV === 'dev') {
    const consoleFormat = format.printf(({ label, message }) => `[${label}] ${message}`)

    logger.add(new transports.Console({
      format: format.combine(format.label({ label }), consoleFormat)
    }));
  }

  return logger;
}