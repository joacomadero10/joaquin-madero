const { Pool } = require('pg');
const logger = require('../config/logger');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no esta definida. Revisa el archivo .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Error en un cliente idle del pool (ej. se cayo la conexion a Postgres).
  // No tiramos el proceso: PM2 lo reiniciaria innecesariamente. Solo logueamos.
  logger.error('Error inesperado en el pool de PostgreSQL', { error: err.message });
});

/**
 * Ejecuta una query simple contra el pool.
 * @param {string} text
 * @param {Array} params
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Obtiene un cliente dedicado del pool para transacciones (BEGIN/COMMIT/ROLLBACK).
 * Recordar hacer client.release() siempre en un finally.
 */
function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
