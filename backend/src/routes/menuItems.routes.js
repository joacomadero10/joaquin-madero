const { Router } = require('express');
const {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuItems.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { validateBody } = require('../middlewares/validate');
const { createMenuItemSchema, updateMenuItemSchema } = require('../validators/menuItems.validators');

const router = Router();

// Todo el CRUD de menu-items es exclusivo del admin del restaurante.
router.get('/:restaurant_id', requireAuth, requireRole('admin'), requireSameRestaurant, listMenuItems);
router.post('/', requireAuth, requireRole('admin'), validateBody(createMenuItemSchema), createMenuItem);
router.patch('/:id', requireAuth, requireRole('admin'), validateBody(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', requireAuth, requireRole('admin'), deleteMenuItem);

module.exports = router;
