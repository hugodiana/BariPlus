// server/routes/nutriRoutes.js

const express = require('express');
const router = express.Router();

// Importe os controllers
const { getDashboardData } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente } = require('../controllers/planoAlimentarController');

// Importe o middleware de proteção
const { protectNutri } = require('../middlewares/authNutri');

// --- Rota do Dashboard ---
router.get('/dashboard', protectNutri, getDashboardData);

// --- Rotas de Convites ---
router.post('/convites/gerar', protectNutri, gerarConvite);

// --- Rotas de Planos Alimentares ---
router.post('/planos/criar', protectNutri, criarPlanoAlimentar);
router.get('/pacientes/:pacienteId/planos', protectNutri, getPlanosPorPaciente);

module.exports = router;