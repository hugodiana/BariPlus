// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { sendMessage, getConversationForPatient } = require('../controllers/messageController');

// CORREÇÃO: Importa apenas o middleware 'authenticateAny' e o 'autenticar' para o paciente
const authenticateAny = require('../middlewares/authenticateAny');
const autenticar = require('../middlewares/autenticar');

// Rota para enviar mensagem (agora usa o middleware flexível)
router.post('/messages/send/:receiverId', authenticateAny, sendMessage);

// Rota para o PACIENTE buscar a sua conversa (continua a usar o middleware de paciente)
router.get('/conversation', autenticar, getConversationForPatient);

module.exports = router;