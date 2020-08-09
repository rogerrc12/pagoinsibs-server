const { createLogger, format, transports } = require('winston');
const path = require('path');

module.exports = createLogger({
  format: format.combine(
    format.simple(),
    format.timestamp(),
    format.printf(info => `${info.timestamp} ${info.level} ${info.message}`)
  ),
  transports: [
    new transports.File({
      maxsize: 5210000,
      maxFiles: 5,
      filename: path.join(__dirname, '..', 'logs', 'api-logs.log')
    }),
    new transports.Console({ level: 'debug' })
  ]
})
