const express = require('express');
const router = express.Router();
const dailyLogController = require('../controllers/dailyLogController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');


// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/dailylog/today', autenticar, verificarPagamento, dailyLogController.getTodayLog);
router.post('/dailylog/track', autenticar, verificarPagamento, dailyLogController.trackConsumption);

module.exports = router;