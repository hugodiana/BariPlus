// server/routes/nutriRoutes.js

const express = require('express');
const router = express.Router();

const { getDashboardData, getPacienteDetails } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente, getPlanoById } = require('../controllers/planoAlimentarController');
const { getProgressoPaciente, getDiarioAlimentarPaciente } = require('../controllers/pacienteDataController');
// CORREÇÃO: Importa a função do controlador correto
const { getConversationForNutri } = require('../controllers/messageController'); 
const { protectNutri } = require('../middlewares/authNutri');

// Rotas de Gestão
router.get('/dashboard', protectNutri, getDashboardData);
router.get('/pacientes/:pacienteId', protectNutri, getPacienteDetails);
router.post('/convites/gerar', protectNutri, gerarConvite);

// Rotas de Planos Alimentares
router.post('/planos/criar', protectNutri, criarPlanoAlimentar);
router.get('/pacientes/:pacienteId/planos', protectNutri, getPlanosPorPaciente);
router.get('/planos/:planoId', protectNutri, getPlanoById);

// Rotas de Acesso a Dados do Paciente
router.get('/paciente/:pacienteId/progresso', protectNutri, getProgressoPaciente);
router.get('/paciente/:pacienteId/diario/:date', protectNutri, getDiarioAlimentarPaciente);
router.get('/pacientes/:pacienteId/conversation', protectNutri, getConversationForNutri); 

// Rota para o nutri buscar a conversa (agora está correta)
router.get('/pacientes/:pacienteId/conversation', protectNutri, getConversationForNutri); 

module.exports = router;