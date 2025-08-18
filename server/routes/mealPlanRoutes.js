// server/routes/mealPlanRoutes.js

const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/mealPlanController');
const autenticar = require('../middlewares/autenticar'); // Middleware do paciente
const verificarPagamento = require('../middlewares/verificarPagamento');

// Rota para o paciente logado buscar o seu plano alimentar ativo
router.get('/meal-plan/my-plan', autenticar, verificarPagamento, mealPlanController.getMyActivePlan);

module.exports = router;