const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const autenticar = require('../middlewares/autenticar'); 

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/me', autenticar, userController.getMe);
router.post('/onboarding', autenticar, userController.onboarding);
router.put('/user/profile', autenticar, userController.updateProfile);
router.put('/user/change-password', autenticar, userController.changePassword);
router.put('/user/surgery-date', autenticar, userController.updateSurgeryDate);
router.post('/user/save-fcm-token', autenticar, userController.saveFcmToken);
router.post('/user/send-test-notification', autenticar, userController.sendTestNotification);
router.put('/user/goals', autenticar, userController.updateGoals);

module.exports = router;