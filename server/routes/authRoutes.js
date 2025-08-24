// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport'); // ✅ CORREÇÃO: Importar o passport
const authController = require('../controllers/authController');
const { body } = require('express-validator');

// Validações...
const registerValidation = [
    body('nome', 'O nome é obrigatório').notEmpty().trim().escape(),
    body('sobrenome', 'O sobrenome é obrigatório').notEmpty().trim().escape(),
    body('username', 'O nome de usuário é obrigatório').notEmpty().trim(),
    body('email', 'Por favor, inclua um e-mail válido').isEmail().normalizeEmail(),
    body('password', 'A senha não cumpre os requisitos de segurança.')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>*]).{8,}$/)
];
const passwordValidation = [
    body('password', 'A nova senha não cumpre os requisitos de segurança.')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>*]).{8,}$/)
];


// --- ROTAS DE AUTENTICAÇÃO PADRÃO ---
router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', passwordValidation, authController.resetPassword);

// --- ROTAS PARA O LOGIN COM GOOGLE ---
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false 
}));

router.get(
    '/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed`,
        session: false 
    }), 
    authController.googleCallback
);

module.exports = router;