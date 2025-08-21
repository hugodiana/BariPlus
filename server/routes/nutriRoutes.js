// server/routes/nutriRoutes.js
const express = require('express');
const router = express.Router();

const { getDashboardData, getPacienteDetails, getRecentActivity } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente, getPlanoById, saveAsTemplate, getTemplates, enviarPlanoPorEmail } = require('../controllers/planoAlimentarController');
const { getProgressoPaciente, getDiarioAlimentarPaciente, getHidratacaoPaciente, getMedicacaoPaciente, addDiaryComment, getExamesPaciente } = require('../controllers/pacienteDataController');
const { getConversationForNutri } = require('../controllers/messageController');
const { createPacienteProntuario, convidarPacienteParaApp } = require('../controllers/pacienteLocalController'); 
const { getAgendamentos, createAgendamento, updateAgendamento, deleteAgendamento } = require('../controllers/agendaController');
const { criarMeta, listarMetasPorPaciente } = require('../controllers/metaController');
const { protectNutri } = require('../middlewares/authNutri');

// --- Rotas de Gestão Geral ---
router.get('/dashboard', protectNutri, getDashboardData);
router.get('/recent-activity', protectNutri, getRecentActivity);
router.get('/pacientes/:pacienteId', protectNutri, getPacienteDetails);
router.post('/convites/gerar', protectNutri, gerarConvite);

// --- Rotas de Gestão de Pacientes (Prontuário e App) ---
router.post('/pacientes', protectNutri, createPacienteProntuario); 
router.post('/pacientes/:id/convidar', protectNutri, convidarPacienteParaApp);

// --- Rotas de Metas ---
router.route('/pacientes/:pacienteId/metas')
    .post(protectNutri, criarMeta)
    .get(protectNutri, listarMetasPorPaciente);

// --- Rotas de Planos Alimentares ---
router.get('/planos/templates', protectNutri, getTemplates); 
router.post('/planos/criar', protectNutri, criarPlanoAlimentar);
router.get('/pacientes/:pacienteId/planos', protectNutri, getPlanosPorPaciente);
router.get('/planos/:planoId', protectNutri, getPlanoById);
router.post('/planos/:planoId/salvar-como-template', protectNutri, saveAsTemplate);
router.post('/planos/:planoId/enviar-email', protectNutri, enviarPlanoPorEmail);

// --- Rotas de Acompanhamento (Dados do App do Paciente) ---
router.get('/paciente/:pacienteId/progresso', protectNutri, getProgressoPaciente);
router.get('/paciente/:pacienteId/diario/:date', protectNutri, getDiarioAlimentarPaciente);
router.post('/paciente/:pacienteId/diario/:date/comment', protectNutri, addDiaryComment);
router.get('/paciente/:pacienteId/hidratacao/:date', protectNutri, getHidratacaoPaciente);
router.get('/paciente/:pacienteId/medicacao/:date', protectNutri, getMedicacaoPaciente);
router.get('/paciente/:pacienteId/exames', protectNutri, getExamesPaciente);
router.get('/pacientes/:pacienteId/conversation', protectNutri, getConversationForNutri); 

// --- Rotas da Agenda ---
router.get('/agenda', protectNutri, getAgendamentos);
router.post('/agenda', protectNutri, createAgendamento);
router.put('/agenda/:id', protectNutri, updateAgendamento);
router.delete('/agenda/:id', protectNutri, deleteAgendamento);

module.exports = router;