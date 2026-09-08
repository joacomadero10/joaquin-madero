const logger = require('../config/logger');

function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  logger.error(err.message, {
    status,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    error: status === 500 && isProd ? 'Error interno del servidor.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
