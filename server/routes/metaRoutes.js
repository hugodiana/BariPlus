// server/routes/metaRoutes.js
const express = require('express');
const router = express.Router();
const { listarMetasParaPaciente } = require('../controllers/metaController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Rota para o paciente logado buscar as suas metas
router.get('/metas', autenticar, verificarPagamento, listarMetasParaPaciente);

module.exports = router;