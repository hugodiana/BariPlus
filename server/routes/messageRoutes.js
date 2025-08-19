// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
// CORREÇÃO: Importa a função correta
const { sendMessage, getConversationForPatient } = require('../controllers/messageController');
const authenticateAny = require('../middlewares/authenticateAny');
const autenticar = require('../middlewares/autenticar'); // Middleware específico para o paciente

// Rota para enviar mensagem (usada por ambos)
router.post('/messages/send/:receiverId', authenticateAny, sendMessage);

// Rota para o PACIENTE buscar a sua conversa
router.get('/conversation', autenticar, getConversationForPatient);

module.exports = router;