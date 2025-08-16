const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const autenticar = require('../middlewares/autenticar'); 
const verificarPagamento = require('../middlewares/verificarPagamento');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/me', autenticar, verificarPagamento, userController.getMe);
router.post('/onboarding', autenticar, verificarPagamento, userController.onboarding);
router.put('/user/profile', autenticar, verificarPagamento, userController.updateProfile);
router.put('/user/change-password', autenticar, verificarPagamento, userController.changePassword);
router.put('/user/surgery-date', autenticar, verificarPagamento, userController.updateSurgeryDate);
router.post('/user/save-fcm-token', autenticar, verificarPagamento, userController.saveFcmToken);
router.post('/user/send-test-notification', autenticar, verificarPagamento, userController.sendTestNotification);
router.put('/user/goals', autenticar, verificarPagamento, userController.updateGoals);

module.exports = router;