const { Router } = require('express');
const { listCategories, createCategory, deleteCategory } = require('../controllers/categories.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { validateBody } = require('../middlewares/validate');
const { createCategorySchema } = require('../validators/categories.validators');

const router = Router();

router.get('/:restaurant_id', requireAuth, requireRole('admin'), requireSameRestaurant, listCategories);
router.post('/', requireAuth, requireRole('admin'), validateBody(createCategorySchema), createCategory);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCategory);

module.exports = router;
