const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/gastos', autenticar, verificarPagamento, gastoController.getGastos);
router.post('/gastos', autenticar, verificarPagamento, gastoController.addGasto);
router.delete('/gastos/:registroId', autenticar, verificarPagamento, gastoController.deleteGasto);

module.exports = router;