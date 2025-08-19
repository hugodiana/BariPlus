// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/messageController');
const authenticateAny = require('../middlewares/authenticateAny');

// Middlewares de autenticação
const autenticar = require('../middlewares/autenticar');
const { protectNutri } = require('../middlewares/authNutri');

// Middleware para permitir que ou um paciente ou um nutri aceda à rota
const allowUserOrNutri = (req, res, next) => {
    if (req.user || req.nutricionista) {
        return next();
    }
    return res.status(401).json({ message: 'Não autorizado.' });
};

// Rota para enviar mensagem (pode ser usada por ambos)
router.post('/messages/send/:receiverId', authenticateAny, sendMessage);

module.exports = router;