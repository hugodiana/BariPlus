const express = require('express');
const router = express.Router();
const foodLogController = require('../controllers/foodLogController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/food-diary/:date', autenticar, verificarPagamento, foodLogController.getDiaryByDate);
router.post('/food-diary/log', autenticar, verificarPagamento, foodLogController.logFood);
router.delete('/food-diary/log/:date/:mealType/:itemId', autenticar, verificarPagamento, foodLogController.deleteFoodLog);

module.exports = router;