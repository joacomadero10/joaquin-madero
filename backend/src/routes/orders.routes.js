const { Router } = require('express');
const { createOrder, getActiveOrders, updateOrderStatus } = require('../controllers/orders.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/orders.validators');

const router = Router();

// Publico, sin auth: lo hace el cliente desde su celular.
router.post('/', validateBody(createOrderSchema), createOrder);

// Requieren auth (mozo/cocina/admin) y solo sobre el restaurante propio.
router.get('/:restaurant_id', requireAuth, requireSameRestaurant, getActiveOrders);
router.patch('/:id/estado', requireAuth, validateBody(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
