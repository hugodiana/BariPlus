const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const autenticar = require('../middlewares/autenticar'); 
const verificarPagamento = require('../middlewares/verificarPagamento');

// 1. Importar e configurar o multer para processar o upload da imagem
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- ROTAS EXISTENTES ---
router.get('/me', autenticar, verificarPagamento, userController.getMe);
router.post('/onboarding', autenticar, verificarPagamento, userController.onboarding);
router.put('/user/profile', autenticar, verificarPagamento, userController.updateProfile);
router.put('/user/change-password', autenticar, verificarPagamento, userController.changePassword);
router.put('/user/surgery-date', autenticar, verificarPagamento, userController.updateSurgeryDate);
router.post('/user/save-fcm-token', autenticar, verificarPagamento, userController.saveFcmToken);
router.post('/user/send-test-notification', autenticar, verificarPagamento, userController.sendTestNotification);
router.put('/user/goals', autenticar, verificarPagamento, userController.updateGoals);

// --- 2. NOVA ROTA PARA A FOTO DE PERFIL ---
// Esta é a linha que estava em falta e que resolve o erro 404.
// Ela define que um pedido PUT para '/user/profile-picture' deve ser processado pelo multer
// e depois pela função 'updateProfilePicture' no seu controlador.
router.put('/user/profile-picture', autenticar, verificarPagamento, upload.single('fotoPerfil'), userController.updateProfilePicture);

module.exports = router;