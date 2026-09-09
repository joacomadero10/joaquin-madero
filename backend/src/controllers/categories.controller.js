const { query } = require('../db/pool');

/**
 * GET /api/categories/:restaurant_id
 * Requiere auth (admin). Lista TODAS las categorias (activas e inactivas),
 * para el panel de administracion del menu.
 */
async function listCategories(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const result = await query(
      `SELECT id, name, position, active, created_at
       FROM categories
       WHERE restaurant_id = $1
       ORDER BY position ASC, name ASC`,
      [restaurant_id]
    );

    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/categories
 * Solo admin. Body: { restaurant_id, name, position? }
 */
async function createCategory(req, res, next) {
  try {
    const { restaurant_id, name, position } = req.body;

    const result = await query(
      `INSERT INTO categories (restaurant_id, name, position)
       VALUES ($1, $2, COALESCE($3, 0))
       RETURNING id, name, position, active, created_at`,
      [restaurant_id, name, position]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/categories/:id
 * Solo admin. Los platos que la usaban quedan con category_id NULL
 * (ON DELETE SET NULL en el schema), no se borran.
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT restaurant_id FROM categories WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Categoria no encontrada.' });
    }
    if (existing.rows[0].restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a esta categoria.' });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listCategories, createCategory, deleteCategory };
