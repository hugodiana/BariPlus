const express = require('express');
const router = express.Router();
const hydrationController = require('../controllers/hydrationController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

router.get('/hydration/:date', autenticar, verificarPagamento, hydrationController.getHydrationLogByDate);
router.post('/hydration/log', autenticar, verificarPagamento, hydrationController.logDrink);
router.delete('/hydration/log/:date/:entryId', autenticar, verificarPagamento, hydrationController.deleteDrinkLog);

module.exports = router;