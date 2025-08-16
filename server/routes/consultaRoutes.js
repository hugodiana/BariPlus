const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/consultas', autenticar, verificarPagamento, consultaController.getConsultas);
router.post('/consultas', autenticar, verificarPagamento, consultaController.addConsulta);
router.put('/consultas/:consultaId', autenticar, verificarPagamento, consultaController.updateConsulta);
router.delete('/consultas/:consultaId', autenticar, consultaController.deleteConsulta);

module.exports = router;