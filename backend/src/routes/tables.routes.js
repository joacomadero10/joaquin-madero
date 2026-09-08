const { Router } = require('express');
const { listTables, createTable, getTableQr } = require('../controllers/tables.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { validateBody } = require('../middlewares/validate');
const { createTableSchema } = require('../validators/tables.validators');

const router = Router();

router.get('/:restaurant_id', requireAuth, requireSameRestaurant, listTables);
router.post('/', requireAuth, requireRole('admin'), validateBody(createTableSchema), createTable);
router.get('/:id/qr', requireAuth, getTableQr);

module.exports = router;
