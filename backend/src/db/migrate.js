/**
 * Script simple de migracion: ejecuta schema.sql completo contra DATABASE_URL.
 * Uso: npm run migrate
 *
 * Es idempotente (todo el schema.sql usa CREATE TABLE IF NOT EXISTS),
 * asi que se puede correr de nuevo sin romper nada si se agregan tablas nuevas.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Ejecutando schema.sql contra la base de datos...');
  try {
    await pool.query(sql);
    console.log('Migracion completada con exito.');
  } catch (err) {
    console.error('Error ejecutando la migracion:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
