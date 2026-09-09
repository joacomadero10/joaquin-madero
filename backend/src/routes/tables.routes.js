const { Router } = require('express');
const {
  listTables,
  createTable,
  getTableQr,
  resolveTableByQrToken,
  updateTableStatus,
} = require('../controllers/tables.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { validateBody } = require('../middlewares/validate');
const { createTableSchema, updateTableStatusSchema } = require('../validators/tables.validators');

const router = Router();

// Publico, sin auth: es lo primero que pega el celular del cliente al escanear el QR.
router.get('/resolve/:qr_token', resolveTableByQrToken);

router.get('/:restaurant_id', requireAuth, requireSameRestaurant, listTables);
router.post('/', requireAuth, requireRole('admin'), validateBody(createTableSchema), createTable);
router.get('/:id/qr', requireAuth, getTableQr);
router.patch('/:id/estado', requireAuth, validateBody(updateTableStatusSchema), updateTableStatus);

module.exports = router;
