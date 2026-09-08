const { query, getClient } = require('../db/pool');
const { emitNuevoPedido, emitPedidoActualizado } = require('../config/socket');

/**
 * Trae un pedido con sus items, ya formateado para la respuesta / el socket.
 */
async function fetchOrderWithItems(orderId) {
  const orderResult = await query(
    `SELECT id, restaurant_id, table_id, status, total, created_at, updated_at
     FROM orders WHERE id = $1`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;

  const itemsResult = await query(
    `SELECT oi.id, oi.menu_item_id, mi.name, oi.quantity, oi.unit_price, oi.notes
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1
     ORDER BY oi.created_at ASC`,
    [orderId]
  );

  return { ...order, items: itemsResult.rows };
}

/**
 * POST /api/orders
 * Sin auth: lo hace el cliente desde su celular al confirmar el pedido.
 * Body: { restaurant_id, table_id?, items: [{ menu_item_id, quantity, notes? }] }
 *
 * Los precios NUNCA se toman del body: se leen de menu_items en el momento,
 * para que un cliente no pueda mandar un precio manipulado.
 */
async function createOrder(req, res, next) {
  const client = await getClient();
  try {
    const { restaurant_id, table_id, items } = req.body;

    await client.query('BEGIN');

    // Traemos precio y disponibilidad reales de los platos pedidos, validando
    // que pertenezcan al restaurante correcto (evita mezclar datos entre tenants).
    const menuItemIds = items.map((item) => item.menu_item_id);
    const menuItemsResult = await client.query(
      `SELECT id, price, available FROM menu_items
       WHERE restaurant_id = $1 AND id = ANY($2::uuid[])`,
      [restaurant_id, menuItemIds]
    );

    const menuItemsById = new Map(menuItemsResult.rows.map((row) => [row.id, row]));

    for (const item of items) {
      const menuItem = menuItemsById.get(item.menu_item_id);
      if (!menuItem) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `El plato ${item.menu_item_id} no existe en este restaurante.` });
      }
      if (!menuItem.available) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `El plato ${item.menu_item_id} no esta disponible.` });
      }
    }

    const total = items.reduce((sum, item) => {
      const menuItem = menuItemsById.get(item.menu_item_id);
      return sum + Number(menuItem.price) * item.quantity;
    }, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (restaurant_id, table_id, status, total)
       VALUES ($1, $2, 'pendiente', $3)
       RETURNING id`,
      [restaurant_id, table_id || null, total]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const menuItem = menuItemsById.get(item.menu_item_id);
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.quantity, menuItem.price, item.notes || null]
      );
    }

    // Si el pedido vino con mesa, la marcamos ocupada.
    if (table_id) {
      await client.query(`UPDATE tables SET status = 'ocupada' WHERE id = $1 AND restaurant_id = $2`, [
        table_id,
        restaurant_id,
      ]);
    }

    await client.query('COMMIT');

    const fullOrder = await fetchOrderWithItems(orderId);
    emitNuevoPedido(restaurant_id, fullOrder);

    return res.status(201).json(fullOrder);
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/orders/:restaurant_id
 * Requiere auth. Devuelve los pedidos activos (no entregados ni cancelados),
 * para las pantallas de cocina y mozo.
 */
async function getActiveOrders(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const ordersResult = await query(
      `SELECT id, restaurant_id, table_id, status, total, created_at, updated_at
       FROM orders
       WHERE restaurant_id = $1 AND status NOT IN ('entregado', 'cancelado')
       ORDER BY created_at ASC`,
      [restaurant_id]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await query(
          `SELECT oi.id, oi.menu_item_id, mi.name, oi.quantity, oi.unit_price, oi.notes
           FROM order_items oi
           JOIN menu_items mi ON mi.id = oi.menu_item_id
           WHERE oi.order_id = $1`,
          [order.id]
        );
        return { ...order, items: itemsResult.rows };
      })
    );

    return res.json(orders);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/orders/:id/estado
 * Requiere auth (mozo/cocina/admin). Body: { estado }
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const existing = await query('SELECT restaurant_id FROM orders WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    // Tenant check: el usuario logueado solo puede tocar pedidos de SU restaurante.
    if (existing.rows[0].restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a este pedido.' });
    }

    await query(`UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`, [estado, id]);

    const fullOrder = await fetchOrderWithItems(id);
    emitPedidoActualizado(fullOrder.restaurant_id, fullOrder);

    return res.json(fullOrder);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, getActiveOrders, updateOrderStatus };
