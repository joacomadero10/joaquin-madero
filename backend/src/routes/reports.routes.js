const { Router } = require('express');
const { getDailyReport } = require('../controllers/reports.controller');
const { requireAuth, requireSameRestaurant } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');

const router = Router();

router.get('/daily/:restaurant_id', requireAuth, requireRole('admin'), requireSameRestaurant, getDailyReport);

module.exports = router;
