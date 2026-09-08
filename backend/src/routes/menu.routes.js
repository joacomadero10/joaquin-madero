const { Router } = require('express');
const { getPublicMenu } = require('../controllers/menu.controller');

const router = Router();

// Publico, sin auth: el cliente escanea el QR y ve el menu.
router.get('/:restaurant_id', getPublicMenu);

module.exports = router;
