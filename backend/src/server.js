require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const logger = require('./config/logger');
const { pool } = require('./db/pool');

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Comandy backend escuchando en el puerto ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
  });
});

// Apagado prolijo: PM2 manda SIGINT/SIGTERM en restart/stop/deploy.
// Cerramos el server HTTP y el pool de PostgreSQL antes de salir,
// para no cortar requests ni conexiones a la DB a mitad de camino.
function shutdown(signal) {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  httpServer.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      logger.error('Error cerrando el pool de PostgreSQL', { error: err.message });
    }
    logger.info('Servidor cerrado correctamente.');
    process.exit(0);
  });

  // Si algo se cuelga, forzamos la salida a los 10s para que PM2 no espere para siempre.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason instanceof Error ? reason.stack : reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.stack });
  // Un uncaughtException deja el proceso en estado inconsistente: lo mejor
  // es dejar que PM2 lo reinicie limpio en vez de seguir corriendo roto.
  process.exit(1);
});
