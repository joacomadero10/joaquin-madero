const { Router } = require('express');

const authRoutes = require('./auth.routes');
const menuRoutes = require('./menu.routes');
const ordersRoutes = require('./orders.routes');
const tablesRoutes = require('./tables.routes');
const menuItemsRoutes = require('./menuItems.routes');
const reportsRoutes = require('./reports.routes');
const categoriesRoutes = require('./categories.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', ordersRoutes);
router.use('/tables', tablesRoutes);
router.use('/menu-items', menuItemsRoutes);
router.use('/reports', reportsRoutes);
router.use('/categories', categoriesRoutes);

module.exports = router;
