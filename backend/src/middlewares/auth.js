const { verifyToken } = require('../utils/jwt');

/**
 * Exige un JWT valido en el header Authorization: Bearer <token>.
 * Cuelga el payload decodificado en req.user = { sub, restaurant_id, role, name }.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autorizado. Falta el token.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado.' });
  }
}

/**
 * Verifica que el :restaurant_id de la URL (o el restaurant_id del body)
 * coincida con el restaurante del usuario logueado. Evita que un mozo/admin
 * de un restaurante opere sobre datos de otro restaurante cliente del SaaS.
 * Debe usarse DESPUES de requireAuth.
 */
function requireSameRestaurant(req, res, next) {
  const paramRestaurantId = req.params.restaurant_id || req.body.restaurant_id;

  if (paramRestaurantId && paramRestaurantId !== req.user.restaurant_id) {
    return res.status(403).json({ error: 'No tenes acceso a este restaurante.' });
  }

  return next();
}

module.exports = { requireAuth, requireSameRestaurant };
