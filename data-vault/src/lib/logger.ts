import winston, { format, transports } from 'winston'
import dotenv from 'dotenv'

dotenv.config()

const ENV = process.env.NODE_ENV || 'dev' 
const FILE = process.env.LOG_FILE || './data-vault.log' 

const customFormat = format.printf((info) => {
  return `${info.timestamp}: [${info.level}] ${info.message}`;
})

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), customFormat),
  transports: [
    new transports.File({ filename: FILE }),
  ],
});

if (ENV === 'dev') {
  logger.add(new transports.Console({
    format: format.colorize(),
  }));
}

export default logger;