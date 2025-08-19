// server/routes/nutriRoutes.js

const express = require('express');
const router = express.Router();

const { getDashboardData, getPacienteDetails } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente, getPlanoById, saveAsTemplate, getTemplates } = require('../controllers/planoAlimentarController');
// CORREÇÃO: Importa a função que faltava
const { getProgressoPaciente, getDiarioAlimentarPaciente, getHidratacaoPaciente, getMedicacaoPaciente, addDiaryComment, getExamesPaciente } = require('../controllers/pacienteDataController');
const { getConversationForNutri } = require('../controllers/messageController');
const { protectNutri } = require('../middlewares/authNutri');

// Rotas de Gestão
router.get('/dashboard', protectNutri, getDashboardData);
router.get('/pacientes/:pacienteId', protectNutri, getPacienteDetails);
router.post('/convites/gerar', protectNutri, gerarConvite);

// Rotas de Planos Alimentares
router.get('/planos/templates', protectNutri, getTemplates); 
router.post('/planos/criar', protectNutri, criarPlanoAlimentar);
router.get('/pacientes/:pacienteId/planos', protectNutri, getPlanosPorPaciente);
router.get('/planos/:planoId', protectNutri, getPlanoById);
router.post('/planos/:planoId/salvar-como-template', protectNutri, saveAsTemplate);

// Rotas de Acesso a Dados do Paciente
router.get('/paciente/:pacienteId/progresso', protectNutri, getProgressoPaciente);
router.get('/paciente/:pacienteId/diario/:date', protectNutri, getDiarioAlimentarPaciente);
router.post('/paciente/:pacienteId/diario/:date/comment', protectNutri, addDiaryComment);
router.get('/paciente/:pacienteId/hidratacao/:date', protectNutri, getHidratacaoPaciente);
router.get('/paciente/:pacienteId/medicacao/:date', protectNutri, getMedicacaoPaciente);
// CORREÇÃO: A rota em falta foi adicionada aqui
router.get('/paciente/:pacienteId/exames', protectNutri, getExamesPaciente);
router.get('/pacientes/:pacienteId/conversation', protectNutri, getConversationForNutri); 

module.exports = router;