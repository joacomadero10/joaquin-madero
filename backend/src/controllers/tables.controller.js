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

module.exports = { listTables, createTable, getTableQr };
