const { Router } = require('express');
const { login, logout } = require('../controllers/auth.controller');
const { validateBody } = require('../middlewares/validate');
const { loginSchema } = require('../validators/auth.validators');

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);

module.exports = router;
