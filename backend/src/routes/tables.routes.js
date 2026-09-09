const { Router } = require('express');
const {
  listTables,
  createTable,
  getTableQr,
  resolveTableByQrToken,
  updateTableStatus,
  requestBill,
} = require('../controllers/tables.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { validateBody } = require('../middlewares/validate');
const { createTableSchema, updateTableStatusSchema } = require('../validators/tables.validators');

const router = Router();

// Publico, sin auth: es lo primero que pega el celular del cliente al escanear el QR.
router.get('/resolve/:qr_token', resolveTableByQrToken);
// Publico, sin auth: el cliente pide la cuenta desde su celular. A diferencia
// de /estado (staff, cualquier estado), esta solo puede pasar ocupada -> cuenta_pedida.
router.patch('/:id/solicitar-cuenta', requestBill);

router.get('/:restaurant_id', requireAuth, requireSameRestaurant, listTables);
router.post('/', requireAuth, requireRole('admin'), validateBody(createTableSchema), createTable);
router.get('/:id/qr', requireAuth, getTableQr);
router.patch('/:id/estado', requireAuth, validateBody(updateTableStatusSchema), updateTableStatus);

module.exports = router;
