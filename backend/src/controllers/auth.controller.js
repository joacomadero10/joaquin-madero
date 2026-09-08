const bcrypt = require('bcrypt');
const { query } = require('../db/pool');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Devuelve un JWT con { sub, restaurant_id, role, name }.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, restaurant_id, name, email, password_hash, role
       FROM users
       WHERE email = $1 AND active = TRUE`,
      [email]
    );

    const user = result.rows[0];

    // Mismo mensaje de error para "no existe" y "password incorrecto":
    // no le damos pistas a quien intenta adivinar credenciales.
    if (!user) {
      return res.status(401).json({ error: 'Credenciales invalidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales invalidas.' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        restaurant_id: user.restaurant_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/logout
 * El JWT es stateless, asi que no hay nada que invalidar server-side:
 * el cliente simplemente descarta el token. Este endpoint existe para
 * que el frontend tenga un llamado explicito y consistente.
 */
function logout(req, res) {
  return res.status(200).json({ message: 'Sesion cerrada.' });
}

module.exports = { login, logout };
