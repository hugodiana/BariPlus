const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/gastos', autenticar, gastoController.getGastos);
router.post('/gastos', autenticar, gastoController.addGasto);
router.delete('/gastos/:registroId', autenticar, gastoController.deleteGasto);

module.exports = router;