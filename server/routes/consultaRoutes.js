const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/consultas', autenticar, consultaController.getConsultas);
router.post('/consultas', autenticar, consultaController.addConsulta);
router.put('/consultas/:consultaId', autenticar, consultaController.updateConsulta);
router.delete('/consultas/:consultaId', autenticar, consultaController.deleteConsulta);

module.exports = router;