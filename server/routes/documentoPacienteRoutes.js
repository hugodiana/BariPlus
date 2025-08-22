// server/routes/documentoPacienteRoutes.js
const express = require('express');
const router = express.Router();
const { getMeusDocumentos } = require('../controllers/documentoPacienteController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

router.get('/documentos', autenticar, verificarPagamento, getMeusDocumentos);

module.exports = router;