// server/routes/prontuarioRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const { getProntuario, updateAnamnese, addAvaliacao, addEvolucao, enviarRelatorioAvaliacoes, updateAvaliacao, deleteAvaliacao, enviarAvaliacaoUnicaPorEmail } = require('../controllers/prontuarioController');

// Todas as rotas aqui são protegidas
router.use(protectNutri);

// Rota para buscar o prontuário completo
router.get('/:pacienteId', getProntuario);

// Rota para atualizar a anamnese
router.put('/:pacienteId/anamnese', updateAnamnese);

// Rota para adicionar uma nova avaliação
router.post('/:pacienteId/avaliacoes', addAvaliacao);
router.post('/:pacienteId/avaliacoes/enviar-relatorio', enviarRelatorioAvaliacoes);
router.put('/:pacienteId/avaliacoes/:avaliacaoId', updateAvaliacao);
router.delete('/:pacienteId/avaliacoes/:avaliacaoId', deleteAvaliacao);
router.post('/:pacienteId/avaliacoes/:avaliacaoId/enviar-email', enviarAvaliacaoUnicaPorEmail);
// ✅ 2. ADICIONE A NOVA ROTA
router.post('/:pacienteId/evolucao', addEvolucao);

module.exports = router;