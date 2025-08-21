// server/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { confirmarConsultaPublico } = require('../controllers/publicController');

// Rota pública para o paciente confirmar a consulta a partir do e-mail
router.get('/consultas/:consultaId/confirmar/:token', confirmarConsultaPublico);

module.exports = router;