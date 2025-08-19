// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { sendMessage, getConversationForPatient } = require('../controllers/messageController'); // Adicione getConversationForPatient

const autenticar = require('../middlewares/autenticar');
const authenticateAny = require('../middlewares/authenticateAny');

// Rota para enviar mensagem (pode ser usada por ambos)
router.post('/messages/send/:receiverId', authenticateAny, sendMessage);

// Rota para o PACIENTE buscar a sua conversa
router.get('/conversation', autenticar, getConversationForPatient);

module.exports = router;