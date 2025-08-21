// server/routes/prontuarioRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');

// ✅ CORREÇÃO: A importação da função com o nome antigo foi removida.
const { 
    getProntuario, 
    updateAnamnese, 
    addAvaliacao, 
    updateAvaliacao,
    deleteAvaliacao,
    addEvolucao,
    enviarAvaliacaoUnicaPorEmail,
    addExameBioquimico,
    deleteExameBioquimico
} = require('../controllers/prontuarioController');

// Todas as rotas aqui são protegidas
router.use(protectNutri);

// Rota para buscar o prontuário completo
router.get('/:pacienteId', getProntuario);

// Rota para atualizar a anamnese
router.put('/:pacienteId/anamnese', updateAnamnese);

// Rotas para avaliações físicas
router.post('/:pacienteId/avaliacoes', addAvaliacao);
router.put('/:pacienteId/avaliacoes/:avaliacaoId', updateAvaliacao);
router.delete('/:pacienteId/avaliacoes/:avaliacaoId', deleteAvaliacao);
router.post('/:pacienteId/avaliacoes/:avaliacaoId/enviar-email', enviarAvaliacaoUnicaPorEmail);

// Rotas para notas de evolução
router.post('/:pacienteId/evolucao', addEvolucao);

// Rotas para exames bioquímicos
router.post('/:pacienteId/exames', addExameBioquimico);
router.delete('/:pacienteId/exames/:exameId', deleteExameBioquimico);


module.exports = router;