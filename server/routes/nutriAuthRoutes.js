// server/routes/nutriAuthRoutes.js

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authNutriController');
const { protectNutri } = require('../middlewares/authNutri'); // Importe o middleware de proteção

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectNutri, getMe);

module.exports = router;