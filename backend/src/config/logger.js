const winston = require('winston');
require('winston-daily-rotate-file');

const LOG_DIR = process.env.LOG_DIR || '/var/log/comandy';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rotacion diaria de logs: separa errores del resto y se queda con 14 dias de historial.
const errorRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d',
});

const combinedRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'comandy-backend' },
  transports: [errorRotateTransport, combinedRotateTransport],
});

// En desarrollo, ademas mostramos todo por consola con formato legible.
// En produccion PM2 ya redirige stdout/stderr a sus propios logs (ver ecosystem.config.js),
// asi que evitamos duplicar todo por consola ahi.
if (NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}] ${message} ${metaStr}`;
        })
      ),
    })
  );
}

module.exports = logger;
module.exports.LOG_DIR = LOG_DIR;
