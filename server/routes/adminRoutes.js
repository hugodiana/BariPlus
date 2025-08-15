const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

// ✅ Rota PÚBLICA para o login de admin
router.post('/admin/login', adminController.loginAdmin);

// ✅ As outras rotas continuam protegidas
router.get('/admin/users', autenticar, isAdmin, adminController.listUsers);
router.post('/admin/grant-access/:userId', autenticar, isAdmin, adminController.grantAccess);
router.post('/admin/users/:userId/revoke-access', autenticar, isAdmin, adminController.revokeAccess);
router.post('/admin/users/:userId/verify-email', autenticar, isAdmin, adminController.verifyUserEmail);
router.get('/admin/stats', autenticar, isAdmin, adminController.getStats);
router.post('/admin/notifications/broadcast', autenticar, isAdmin, adminController.sendBroadcastNotification);

module.exports = router;