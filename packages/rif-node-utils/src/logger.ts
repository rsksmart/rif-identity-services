import winston, { format, transports } from 'winston'

const fileFormat = format.printf(
  ({ timestamp, level, label, message }) => `${timestamp} [${label}] ${level.toUpperCase()} ${message}`
)

const fileErrorFormat = format.printf(
  ({ timestamp, stack, label }) => `${timestamp} [${label}] ${stack}`
)

export const loggerFactory = (config: { env: string, infoFile: string, errorFile: string }) => (label: string) => {
  const logger = winston.createLogger({
    transports: [
      new transports.File({
        filename: config.infoFile,
        level: 'info',
        format: format.combine(
          format.label({ label }),
          format.timestamp(),
          fileFormat
        )
      }),
      new transports.File({
        filename: config.errorFile,
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

  if (config.env === 'dev') {
    const consoleFormat = format.printf(({ label, message }) => `[${label}] ${message}`)

    logger.add(new transports.Console({
      format: format.combine(format.label({ label }), consoleFormat)
    }));
  }

  return logger;
}
