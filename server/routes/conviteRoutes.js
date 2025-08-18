// server/routes/conviteRoutes.js

const express = require('express');
const router = express.Router();
const { getConviteInfo, aceitarConvite } = require('../controllers/conviteController');

// CORREÇÃO: Usando o middleware 'autenticar' que já existe para proteger a rota do paciente.
const autenticar = require('../middlewares/autenticar');

// Rota pública para qualquer um ver os dados do convite
// GET /api/convites/:codigo
router.get('/:codigo', getConviteInfo);

// Rota privada para o paciente aceitar o convite
// POST /api/convites/aceitar
router.post('/aceitar', autenticar, aceitarConvite); // <-- Rota protegida corretamente

module.exports = router;