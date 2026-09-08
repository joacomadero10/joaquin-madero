const { query } = require('../db/pool');

/**
 * GET /api/reports/daily/:restaurant_id
 * Requiere auth (admin). Resumen del dia actual: total de pedidos, facturacion
 * y los platos mas pedidos, para la pantalla de reportes del dueño.
 */
async function getDailyReport(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const summaryResult = await query(
      `SELECT
         COUNT(*)::int AS total_pedidos,
         COALESCE(SUM(total), 0)::numeric AS total_facturado
       FROM orders
       WHERE restaurant_id = $1
         AND status != 'cancelado'
         AND created_at::date = CURRENT_DATE`,
      [restaurant_id]
    );

    const topItemsResult = await query(
      `SELECT mi.id, mi.name, SUM(oi.quantity)::int AS cantidad_vendida
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE o.restaurant_id = $1
         AND o.status != 'cancelado'
         AND o.created_at::date = CURRENT_DATE
       GROUP BY mi.id, mi.name
       ORDER BY cantidad_vendida DESC
       LIMIT 10`,
      [restaurant_id]
    );

    const byStatusResult = await query(
      `SELECT status, COUNT(*)::int AS cantidad
       FROM orders
       WHERE restaurant_id = $1 AND created_at::date = CURRENT_DATE
       GROUP BY status`,
      [restaurant_id]
    );

    return res.json({
      fecha: new Date().toISOString().slice(0, 10),
      total_pedidos: summaryResult.rows[0].total_pedidos,
      total_facturado: Number(summaryResult.rows[0].total_facturado),
      pedidos_por_estado: byStatusResult.rows,
      platos_mas_vendidos: topItemsResult.rows,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getDailyReport };
