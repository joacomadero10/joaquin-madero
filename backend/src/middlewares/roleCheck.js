/**
 * Middleware factory: exige que req.user.role este dentro de los roles permitidos.
 * Uso: router.post('/', requireAuth, requireRole('admin'), controller)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenes permisos para esta accion.' });
    }
    return next();
  };
}

module.exports = { requireRole };
