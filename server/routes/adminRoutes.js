const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

// Aplica os middlewares a cada rota individualmente
router.get('/admin/users', autenticar, isAdmin, adminController.listUsers);
router.post('/admin/grant-access/:userId', autenticar, isAdmin, adminController.grantAccess);
router.get('/admin/stats', autenticar, isAdmin, adminController.getStats);

// ✅ NOVAS ROTAS
router.post('/admin/users/:userId/revoke-access', autenticar, isAdmin, adminController.revokeAccess);
router.post('/admin/users/:userId/verify-email', autenticar, isAdmin, adminController.verifyUserEmail);

module.exports = router;