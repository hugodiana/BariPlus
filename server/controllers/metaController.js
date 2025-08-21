// server/controllers/metaController.js
const Meta = require('../models/Meta');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');

// Função auxiliar para verificar se o paciente pertence ao nutricionista
const checkPatientOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId).populate('pacientes', 'statusConta');
    if (!nutri) return false;
    
    const paciente = nutri.pacientes.find(p => p._id.toString() === pacienteId);
    // Garante que o paciente pertence ao nutri E que é um utilizador ativo do app
    return paciente && paciente.statusConta === 'ativo';
};


// @desc    Nutricionista cria uma nova meta para um paciente
// @route   POST /api/nutri/pacientes/:pacienteId/metas
exports.criarMeta = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        if (!await checkPatientOwnership(nutricionistaId, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado. As metas só podem ser definidas para pacientes com o app BariPlus ativo.' });
        }

        const { descricao, tipo, valorAlvo, unidade, prazo } = req.body;

        const novaMeta = await Meta.create({
            descricao, tipo, valorAlvo, unidade, prazo,
            nutricionistaId,
            pacienteId
        });

        res.status(201).json(novaMeta);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar a meta.' });
    }
};

// @desc    Nutricionista lista as metas de um paciente
// @route   GET /api/nutri/pacientes/:pacienteId/metas
exports.listarMetasPorPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        if (!await checkPatientOwnership(nutricionistaId, pacienteId)) {
            // Se não tem acesso, simplesmente retorna uma lista vazia para não quebrar o frontend.
            return res.status(200).json([]);
        }

        const metas = await Meta.find({ pacienteId }).sort({ prazo: -1 }); // Ordena pelas mais recentes
        res.status(200).json(metas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar as metas.' });
    }
};

// @desc    Paciente lista as suas próprias metas ativas
// @route   GET /api/metas
exports.listarMetasParaPaciente = async (req, res) => {
    try {
        const pacienteId = req.userId;
        const metas = await Meta.find({ 
            pacienteId: pacienteId, 
            status: 'ativa'
        }).sort({ prazo: 1 });
        res.status(200).json(metas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar as suas metas.' });
    }
};