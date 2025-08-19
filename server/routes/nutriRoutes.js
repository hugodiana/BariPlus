// server/routes/nutriRoutes.js

const express = require('express');
const router = express.Router();

// Importe os controllers
const { getDashboardData, getPacienteDetails } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente } = require('../controllers/planoAlimentarController');
// NOVA IMPORTAÇÃO
const { getProgressoPaciente, getDiarioAlimentarPaciente } = require('../controllers/pacienteDataController');

// Importe o middleware de proteção
const { protectNutri } = require('../middlewares/authNutri');

// --- Rotas de Gestão ---
router.get('/dashboard', protectNutri, getDashboardData);
router.get('/pacientes/:pacienteId', protectNutri, getPacienteDetails);
router.post('/convites/gerar', protectNutri, gerarConvite);
router.post('/planos/criar', protectNutri, criarPlanoAlimentar);
router.get('/pacientes/:pacienteId/planos', protectNutri, getPlanosPorPaciente);

// --- NOVAS ROTAS DE ACESSO A DADOS ---
router.get('/paciente/:pacienteId/progresso', protectNutri, getProgressoPaciente);
router.get('/paciente/:pacienteId/diario/:date', protectNutri, getDiarioAlimentarPaciente);


module.exports = router;