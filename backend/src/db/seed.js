/**
 * Carga un restaurante de prueba + usuario admin, para poder loguearse
 * y probar la API apenas se levanta el backend.
 *
 * Uso: npm run seed
 *
 * Las credenciales se pueden sobreescribir con variables de entorno:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./pool');

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@comandy.com.ar';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'CambiarPassword123!';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const restaurantResult = await client.query(
      `INSERT INTO restaurants (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Restaurante Demo', 'demo']
    );
    const restaurantId = restaurantResult.rows[0].id;

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await client.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [restaurantId, 'Admin Demo', adminEmail, passwordHash]
    );

    await client.query('COMMIT');

    console.log('Seed completado.');
    console.log(`  restaurant_id: ${restaurantId}`);
    console.log(`  admin email:   ${adminEmail}`);
    console.log(`  admin pass:    ${adminPassword}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en el seed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
