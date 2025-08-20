// server/routes/prontuarioRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
// ✅ 1. IMPORTE A NOVA FUNÇÃO
const { getProntuario, updateAnamnese, addAvaliacao, addEvolucao } = require('../controllers/prontuarioController');

// Todas as rotas aqui são protegidas
router.use(protectNutri);

// Rota para buscar o prontuário completo
router.get('/:pacienteId', getProntuario);

// Rota para atualizar a anamnese
router.put('/:pacienteId/anamnese', updateAnamnese);

// Rota para adicionar uma nova avaliação
router.post('/:pacienteId/avaliacoes', addAvaliacao);

// ✅ 2. ADICIONE A NOVA ROTA
router.post('/:pacienteId/evolucao', addEvolucao);

module.exports = router;