// server/routes/conviteRoutes.js

const express = require('express');
const router = express.Router();
const { getConviteInfo, aceitarConvite } = require('../controllers/conviteController');

// Assumindo que você tem um middleware de autenticação de paciente
const { protectPaciente } = require('../middlewares/authPaciente'); // <-- Adapte para o seu middleware

// Rota pública para qualquer um ver os dados do convite
// GET /api/convites/:codigo
router.get('/:codigo', getConviteInfo);

// Rota privada para o paciente aceitar o convite
// POST /api/convites/aceitar
router.post('/aceitar', protectPaciente, aceitarConvite); // <-- Protegida

module.exports = router;