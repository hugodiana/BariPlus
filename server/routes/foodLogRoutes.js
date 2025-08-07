const express = require('express');
const router = express.Router();
const foodLogController = require('../controllers/foodLogController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/food-diary/:date', autenticar, foodLogController.getDiaryByDate);
router.post('/food-diary/log', autenticar, foodLogController.logFood);
router.delete('/food-diary/log/:date/:mealType/:itemId', autenticar, foodLogController.deleteFoodLog);

module.exports = router;