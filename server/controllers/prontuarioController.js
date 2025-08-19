// server/controllers/prontuarioController.js
const PacienteNutri = require('../models/PacienteNutri');

// Função auxiliar para verificar a posse do paciente
const checkOwnership = async (nutricionistaId, pacienteId) => {
    const paciente = await PacienteNutri.findById(pacienteId);
    return paciente && paciente.nutricionistaId.toString() === nutricionistaId;
};

// @desc    Obter os detalhes completos de um paciente local (prontuário)
// @route   GET /api/nutri/prontuario/:pacienteId
exports.getProntuario = async (req, res) => {
    try {
        if (!await checkOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const paciente = await PacienteNutri.findById(req.params.pacienteId);
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar prontuário.' });
    }
};

// @desc    Atualizar a anamnese de um paciente local
// @route   PUT /api/nutri/prontuario/:pacienteId/anamnese
exports.updateAnamnese = async (req, res) => {
    try {
        if (!await checkOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        
        const { objetivo, historicoSaude, historicoFamiliar, habitos } = req.body;
        const paciente = await PacienteNutri.findByIdAndUpdate(
            req.params.pacienteId,
            { $set: { objetivo, historicoSaude, historicoFamiliar, habitos } },
            { new: true }
        );
        res.json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar anamnese.' });
    }
};

// @desc    Adicionar uma nova avaliação física para um paciente local
// @route   POST /api/nutri/prontuario/:pacienteId/avaliacoes
exports.addAvaliacao = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const paciente = await PacienteNutri.findById(pacienteId);
        // Calcula o IMC se peso e altura forem fornecidos
        if (req.body.peso && req.body.altura) {
            const alturaEmMetros = req.body.altura / 100;
            req.body.imc = (req.body.peso / (alturaEmMetros * alturaEmMetros)).toFixed(2);
        }
        
        paciente.avaliacoes.push(req.body);
        await paciente.save();
        
        res.status(201).json(paciente);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar avaliação.' });
    }
};