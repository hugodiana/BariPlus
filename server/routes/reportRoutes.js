const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Rota protegida para o UTILIZADOR gerar um novo link
router.post('/reports/generate', autenticar, verificarPagamento, reportController.generateShareableReport);

// Rota PÚBLICA para que qualquer pessoa com o link possa ver o relatório
router.get('/public/report/:token', reportController.getPublicReport);

module.exports = router;