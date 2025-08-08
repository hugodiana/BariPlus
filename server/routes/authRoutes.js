const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticar = require('../middlewares/autenticar');


// Define as rotas e associa cada uma à sua função no controller
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;