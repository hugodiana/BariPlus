// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

router.post('/admin/login', adminController.loginAdmin);

// Aplica a proteção de admin a todas as rotas abaixo
router.use(autenticar, isAdmin);

// Rotas de Dashboard
router.get('/admin/stats', adminController.getStats);

// Rotas de Gestão de Pacientes
router.get('/admin/users', adminController.listUsers);
router.post('/admin/grant-access/:userId', adminController.grantAccess);
router.post('/admin/users/:userId/revoke-access', adminController.revokeAccess);
router.post('/admin/users/:userId/verify-email', adminController.verifyUserEmail);

// Rotas de Gestão de Nutricionistas (NOVAS)
router.get('/admin/nutricionistas', adminController.listNutricionistas);
router.get('/admin/nutricionistas/:id', adminController.getNutricionistaById);
router.put('/admin/nutricionistas/:id', adminController.updateNutricionista);

// Rota de Notificação
router.post('/admin/notifications/broadcast', adminController.sendBroadcastNotification);

module.exports = router;