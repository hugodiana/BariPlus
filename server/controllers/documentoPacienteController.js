// server/controllers/documentoPacienteController.js
const Prontuario = require('../models/Prontuario');

// @desc    Paciente busca os seus documentos partilhados
// @route   GET /api/documentos
exports.getMeusDocumentos = async (req, res) => {
    try {
        const pacienteId = req.userId;
        const prontuario = await Prontuario.findOne({ pacienteId });

        if (!prontuario) {
            return res.json([]); // Retorna lista vazia se não houver prontuário
        }

        // Filtra para retornar apenas os documentos marcados como 'partilhado'
        const documentosPartilhados = prontuario.documentos.filter(doc => doc.partilhado);

        res.json(documentosPartilhados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar documentos.' });
    }
};