/**
 * Middleware factory: valida req.body (o req.params) contra un schema de zod.
 * Corta la request con 400 y el detalle de los errores si no matchea.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Datos invalidos.',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    return next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Parametros invalidos.',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.params = { ...req.params, ...result.data };
    return next();
  };
}

module.exports = { validateBody, validateParams };
