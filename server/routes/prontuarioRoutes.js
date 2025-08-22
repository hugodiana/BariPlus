// server/routes/prontuarioRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const multer = require('multer');

const { 
    getProntuario, 
    updateAnamnese, 
    addAvaliacao, 
    updateAvaliacao,
    deleteAvaliacao,
    addEvolucao,
    enviarAvaliacaoUnicaPorEmail,
    addExameBioquimico,
    deleteExameBioquimico,
    gerarAtestado,
    getAtestados
} = require('../controllers/prontuarioController');
const { uploadDocumento, deleteDocumento, toggleShareDocumento, sendDocumentoPorEmail, downloadDocumento } = require('../controllers/documentoController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(protectNutri);

// Rota para buscar o prontuário completo
router.get('/:pacienteId', getProntuario);

// Rota para atualizar a anamnese
router.put('/:pacienteId/anamnese', updateAnamnese);

// Rotas para avaliações físicas
router.post('/:pacienteId/avaliacoes', addAvaliacao);
router.put('/:pacienteId/avaliacoes/:avaliacaoId', updateAvaliacao);
router.delete('/:pacienteId/avaliacoes/:avaliacaoId', deleteAvaliacao);
router.post('/:pacienteId/avaliacoes/:avaliacaoId/enviar-email', sendDocumentoPorEmail); // Corrigido para a função correta

// Rotas para notas de evolução
router.post('/:pacienteId/evolucao', addEvolucao);

// Rotas para exames bioquímicos
router.post('/:pacienteId/exames', addExameBioquimico);
router.delete('/:pacienteId/exames/:exameId', deleteExameBioquimico);

// Rotas para documentos
router.post('/:pacienteId/documentos', upload.single('documento'), uploadDocumento);
router.delete('/:pacienteId/documentos/:docId', deleteDocumento);
router.post('/:pacienteId/documentos/:docId/toggle-share', toggleShareDocumento);
router.post('/:pacienteId/documentos/:docId/send-email', sendDocumentoPorEmail);

// ✅ CORREÇÃO: As rotas de atestados foram movidas para aqui, dentro da proteção
router.get('/:pacienteId/documentos/:docId/download', downloadDocumento);
router.get('/:pacienteId/atestados', getAtestados);
router.post('/:pacienteId/gerar-atestado', gerarAtestado);

module.exports = router;