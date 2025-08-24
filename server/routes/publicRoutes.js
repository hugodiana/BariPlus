// server/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { confirmarConsultaPublico, getNutricionistaDetailsById } = require('../controllers/publicController'); // Import new function
const autenticar = require('../middlewares/autenticar'); // Import autenticar middleware

// Rota pública para o paciente confirmar a consulta a partir do e-mail
router.get('/consultas/:consultaId/confirmar/:token', confirmarConsultaPublico);

// Nova rota pública para buscar detalhes do nutricionista por ID (protegida por autenticação geral)
router.get('/nutri/:id', autenticar, getNutricionistaDetailsById);

module.exports = router;