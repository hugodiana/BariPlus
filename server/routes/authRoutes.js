const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
// Estas rotas não devem ter os middlewares 'autenticar' ou 'isAdmin'
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);


module.exports = router;