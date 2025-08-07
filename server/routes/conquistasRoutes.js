const express = require('express');
const router = express.Router();
const conquistasController = require('../controllers/conquistasController');
const autenticar = require('../middlewares/autenticar');

router.get('/conquistas', autenticar, conquistasController.getMinhasConquistas);

module.exports = router;