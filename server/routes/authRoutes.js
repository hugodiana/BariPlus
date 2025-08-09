const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

// ✅ CORREÇÃO: As rotas estão agora agrupadas sob /admin e usam os middlewares corretamente

// Aplica os middlewares a todas as rotas deste ficheiro
router.use('/admin', autenticar, isAdmin);

router.get('/admin/users', adminController.listUsers);
router.post('/admin/grant-access/:userId', adminController.grantAccess);
router.post('/admin/users/:userId/revoke-access', adminController.revokeAccess);
router.post('/admin/users/:userId/verify-email', adminController.verifyUserEmail);
router.get('/admin/stats', adminController.getStats);

module.exports = router;