const { query } = require('../db/pool');

/**
 * GET /api/menu/:restaurant_id
 * Publico, sin auth. Devuelve las categorias activas con sus platos disponibles,
 * para que el cliente vea el menu al escanear el QR de la mesa.
 */
async function getPublicMenu(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const restaurantResult = await query('SELECT id, name FROM restaurants WHERE id = $1 AND active = TRUE', [
      restaurant_id,
    ]);
    if (!restaurantResult.rows[0]) {
      return res.status(404).json({ error: 'Restaurante no encontrado.' });
    }

    const categoriesResult = await query(
      `SELECT id, name, position
       FROM categories
       WHERE restaurant_id = $1 AND active = TRUE
       ORDER BY position ASC, name ASC`,
      [restaurant_id]
    );

    const itemsResult = await query(
      `SELECT id, category_id, name, description, price, image_url
       FROM menu_items
       WHERE restaurant_id = $1 AND available = TRUE
       ORDER BY name ASC`,
      [restaurant_id]
    );

    const categories = categoriesResult.rows.map((category) => ({
      ...category,
      items: itemsResult.rows.filter((item) => item.category_id === category.id),
    }));

    // Platos sin categoria asignada (o con categoria inactiva) van aparte,
    // para no perderlos silenciosamente del menu publico.
    const uncategorized = itemsResult.rows.filter(
      (item) => !categories.some((c) => c.id === item.category_id)
    );

    return res.json({ restaurant: restaurantResult.rows[0], categories, uncategorized });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPublicMenu };
