const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no esta definida. Revisa el archivo .env');
}

/**
 * Firma un token para un usuario de staff (admin/mozo/cocina).
 * El payload lleva restaurant_id para poder validar en cada request
 * que el usuario solo opera sobre datos de SU restaurante.
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      restaurant_id: user.restaurant_id,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
