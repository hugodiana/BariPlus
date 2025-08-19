// server/routes/nutriRoutes.js
const express = require('express');
const router = express.Router();

const { getDashboardData, getPacienteDetails } = require('../controllers/nutriController');
const { gerarConvite } = require('../controllers/conviteController');
const { criarPlanoAlimentar, getPlanosPorPaciente, getPlanoById, saveAsTemplate, getTemplates } = require('../controllers/planoAlimentarController');
const { getProgressoPaciente, getDiarioAlimentarPaciente, getHidratacaoPaciente, getMedicacaoPaciente, addDiaryComment, getExamesPaciente } = require('../controllers/pacienteDataController');
const { getConversationForNutri } = require('../controllers/messageController');
const { createPacienteLocal, getPacientesLocais } = require('../controllers/pacienteLocalController');
const { getAgendamentos, createAgendamento, updateAgendamento } = require('../controllers/agendaController');
const { getProntuario, updateAnamnese, addAvaliacao } = require('../controllers/prontuarioController');
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

// Rotas de Acesso a Dados do Paciente BariPlus
router.get('/paciente/:pacienteId/progresso', protectNutri, getProgressoPaciente);
router.get('/paciente/:pacienteId/diario/:date', protectNutri, getDiarioAlimentarPaciente);
router.post('/paciente/:pacienteId/diario/:date/comment', protectNutri, addDiaryComment);
router.get('/paciente/:pacienteId/hidratacao/:date', protectNutri, getHidratacaoPaciente);
router.get('/paciente/:pacienteId/medicacao/:date', protectNutri, getMedicacaoPaciente);
router.get('/paciente/:pacienteId/exames', protectNutri, getExamesPaciente);
router.get('/pacientes/:pacienteId/conversation', protectNutri, getConversationForNutri); 

// Rotas para Pacientes Locais (Prontuário)
router.post('/pacientes-locais', protectNutri, createPacienteLocal);
router.get('/pacientes-locais', protectNutri, getPacientesLocais);
router.get('/prontuario/:pacienteId', protectNutri, getProntuario);
router.put('/prontuario/:pacienteId/anamnese', protectNutri, updateAnamnese);
router.post('/prontuario/:pacienteId/avaliacoes', protectNutri, addAvaliacao);

// Rotas da Agenda
router.get('/agenda', protectNutri, getAgendamentos);
router.post('/agenda', protectNutri, createAgendamento);
router.put('/agenda/:id', protectNutri, updateAgendamento);

module.exports = router;