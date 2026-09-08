const { query } = require('../db/pool');

/**
 * GET /api/menu-items/:restaurant_id
 * Requiere auth (admin). Lista TODOS los platos (incluidos los no disponibles),
 * a diferencia del menu publico que solo muestra los disponibles.
 */
async function listMenuItems(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const result = await query(
      `SELECT id, category_id, name, description, price, image_url, available, created_at, updated_at
       FROM menu_items
       WHERE restaurant_id = $1
       ORDER BY name ASC`,
      [restaurant_id]
    );

    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/menu-items
 * Solo admin. Body: { restaurant_id, category_id?, name, description?, price, image_url?, available? }
 */
async function createMenuItem(req, res, next) {
  try {
    const { restaurant_id, category_id, name, description, price, image_url, available } = req.body;

    const result = await query(
      `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, available)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE))
       RETURNING id, category_id, name, description, price, image_url, available, created_at, updated_at`,
      [restaurant_id, category_id || null, name, description || null, price, image_url || null, available]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/menu-items/:id
 * Solo admin. Actualiza parcialmente un plato. Verifica tenant antes de tocar nada.
 */
async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await query('SELECT restaurant_id FROM menu_items WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Plato no encontrado.' });
    }
    if (existing.rows[0].restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a este plato.' });
    }

    const allowedFields = ['category_id', 'name', 'description', 'price', 'image_url', 'available'];
    const fieldsToUpdate = Object.keys(updates).filter((key) => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos validos para actualizar.' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fieldsToUpdate.map((field) => updates[field]);

    const result = await query(
      `UPDATE menu_items SET ${setClause}, updated_at = now()
       WHERE id = $1
       RETURNING id, category_id, name, description, price, image_url, available, created_at, updated_at`,
      [id, ...values]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/menu-items/:id
 * Solo admin.
 */
async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await query('SELECT restaurant_id FROM menu_items WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Plato no encontrado.' });
    }
    if (existing.rows[0].restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a este plato.' });
    }

    await query('DELETE FROM menu_items WHERE id = $1', [id]);

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };
