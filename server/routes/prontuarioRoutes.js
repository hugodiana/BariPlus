// server/routes/prontuarioRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const multer = require('multer');

const { 
    getProntuario, updateAnamnese, addAvaliacao, updateAvaliacao,
    deleteAvaliacao, addEvolucao, enviarAvaliacaoUnicaPorEmail,
    addExameBioquimico, deleteExameBioquimico, gerarAtestado, getAtestados
} = require('../controllers/prontuarioController');
const { uploadDocumento, deleteDocumento } = require('../controllers/documentoController');


const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ CORREÇÃO: Aplicamos o middleware de proteção a TODAS as rotas deste ficheiro.
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

// Rotas para documentos
router.post('/:pacienteId/documentos', upload.single('documento'), uploadDocumento);
router.delete('/:pacienteId/documentos/:docId', deleteDocumento);

// Rota para gerar atestado
router.get('/:pacienteId/atestados', getAtestados);
router.post('/:pacienteId/gerar-atestado', gerarAtestado);

module.exports = router;