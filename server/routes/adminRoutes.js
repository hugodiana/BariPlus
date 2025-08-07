const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

// ✅ CORREÇÃO: Aplicamos os middlewares a cada rota individualmente
router.get('/admin/users', autenticar, isAdmin, adminController.listUsers);
router.post('/admin/grant-access/:userId', autenticar, isAdmin, adminController.grantAccess);
router.get('/admin/stats', autenticar, isAdmin, adminController.getStats);

module.exports = router;