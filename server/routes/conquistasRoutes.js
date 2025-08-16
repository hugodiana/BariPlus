const express = require('express');
const router = express.Router();
const conquistasController = require('../controllers/conquistasController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

router.get('/conquistas', autenticar, verificarPagamento, conquistasController.getMinhasConquistas);

module.exports = router;