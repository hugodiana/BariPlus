// server/controllers/metaController.js
const Meta = require('../models/Meta');
const Nutricionista = require('../models/Nutricionista');

// Função auxiliar para verificar se o paciente pertence ao nutricionista
const checkPatientOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    return nutri && nutri.pacientesBariplus.some(pId => pId.toString() === pacienteId);
};


// @desc    Nutricionista cria uma nova meta para um paciente
// @route   POST /api/nutri/pacientes/:pacienteId/metas
exports.criarMeta = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        if (!await checkPatientOwnership(nutricionistaId, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        // ✅ CORREÇÃO: Agora recebemos todos os dados necessários do formulário
        const { descricao, tipo, valorAlvo, unidade, prazo } = req.body;

        const novaMeta = await Meta.create({
            descricao,
            tipo,
            valorAlvo,
            unidade,
            prazo,
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
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const metas = await Meta.find({ pacienteId }).sort({ prazo: 1 });
        res.status(200).json(metas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar as metas.' });
    }
};

// @desc    Paciente lista as suas próprias metas ativas
// @route   GET /api/metas
exports.listarMetasParaPaciente = async (req, res) => {
    try {
        const pacienteId = req.userId; // Vem do middleware 'autenticar'

        const metas = await Meta.find({ 
            pacienteId: pacienteId, 
            status: 'ativa' // Mostra apenas as metas que ainda não foram concluídas
        }).sort({ prazo: 1 });

        res.status(200).json(metas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar as suas metas.' });
    }
};