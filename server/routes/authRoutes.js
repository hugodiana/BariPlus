// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

// Regras de validação para o registo
const registerValidation = [
    body('nome', 'O nome é obrigatório').notEmpty().trim().escape(),
    body('sobrenome', 'O sobrenome é obrigatório').notEmpty().trim().escape(),
    body('username', 'O nome de usuário é obrigatório').notEmpty().trim(),
    body('email', 'Por favor, inclua um e-mail válido').isEmail().normalizeEmail(),
    body('password', 'A senha não cumpre os requisitos de segurança.')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>*]).{8,}$/)
];

// --- CORREÇÃO APLICADA AQUI ---
// Novas regras de validação, apenas para o campo de senha
const passwordValidation = [
    body('password', 'A nova senha não cumpre os requisitos de segurança.')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>*]).{8,}$/)
];

// --- ROTAS PÚBLICAS DE AUTENTICAÇÃO ---
router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
// A rota agora usa o middleware de validação de senha
router.post('/reset-password/:token', passwordValidation, authController.resetPassword);

module.exports = router;