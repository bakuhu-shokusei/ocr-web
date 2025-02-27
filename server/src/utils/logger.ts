import { createLogger, transports, format } from 'winston'
import 'winston-daily-rotate-file'

export const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    format.simple(),
  ),
  transports: [
    new transports.DailyRotateFile({
      dirname: 'logs',
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({}))
}
