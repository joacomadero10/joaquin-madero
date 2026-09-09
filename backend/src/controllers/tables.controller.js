const { query } = require('../db/pool');
const { generateQrToken, generateQrImageBuffer } = require('../utils/qr');

/**
 * GET /api/tables/:restaurant_id
 * Requiere auth. Lista las mesas del restaurante.
 */
async function listTables(req, res, next) {
  try {
    const { restaurant_id } = req.params;

    const result = await query(
      `SELECT id, name, status, created_at
       FROM tables
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
 * POST /api/tables
 * Solo admin. Body: { restaurant_id, name }
 * Genera automaticamente el qr_token unico de la mesa.
 */
async function createTable(req, res, next) {
  try {
    const { restaurant_id, name } = req.body;
    const qrToken = generateQrToken();

    const result = await query(
      `INSERT INTO tables (restaurant_id, name, qr_token)
       VALUES ($1, $2, $3)
       RETURNING id, name, status, created_at`,
      [restaurant_id, name, qrToken]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/tables/:id/qr
 * Requiere auth. Genera y devuelve la imagen PNG del QR de la mesa.
 */
async function getTableQr(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query('SELECT id, restaurant_id, qr_token FROM tables WHERE id = $1', [id]);
    const table = result.rows[0];

    if (!table) {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    if (table.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a esta mesa.' });
    }

    const imageBuffer = await generateQrImageBuffer(table.qr_token);

    res.set('Content-Type', 'image/png');
    return res.send(imageBuffer);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/tables/resolve/:qr_token
 * Publico, sin auth. El cliente escanea el QR de la mesa (que apunta a
 * /mesa/:qr_token en el frontend) y este endpoint resuelve ese token a
 * restaurant_id + table_id, para que el frontend sepa que menu mostrar
 * y a que mesa asociar el pedido.
 */
async function resolveTableByQrToken(req, res, next) {
  try {
    const { qr_token } = req.params;

    const result = await query(
      `SELECT id, restaurant_id, name, status
       FROM tables
       WHERE qr_token = $1`,
      [qr_token]
    );

    const table = result.rows[0];
    if (!table) {
      return res.status(404).json({ error: 'Mesa no encontrada. QR invalido.' });
    }

    return res.json(table);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/tables/:id/estado
 * Requiere auth (mozo/admin). Body: { estado }
 * Lo usa el mozo para liberar la mesa al cerrar la cuenta, o marcarla
 * "cuenta_pedida" cuando el cliente la pide.
 */
async function updateTableStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const existing = await query('SELECT restaurant_id FROM tables WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Mesa no encontrada.' });
    }
    if (existing.rows[0].restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ error: 'No tenes acceso a esta mesa.' });
    }

    const result = await query(
      `UPDATE tables SET status = $1 WHERE id = $2
       RETURNING id, name, status, created_at`,
      [estado, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listTables, createTable, getTableQr, resolveTableByQrToken, updateTableStatus };
