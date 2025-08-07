const express = require('express');
const router = express.Router();
const dailyLogController = require('../controllers/dailyLogController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/dailylog/today', autenticar, dailyLogController.getTodayLog);
router.post('/dailylog/track', autenticar, dailyLogController.trackConsumption);

module.exports = router;