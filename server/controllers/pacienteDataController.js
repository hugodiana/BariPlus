// server/controllers/pacienteDataController.js

const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const FoodLog = require('../models/foodLogModel');
const Nutricionista = require('../models/Nutricionista');

// Função auxiliar para verificar se o paciente pertence ao nutricionista
const checkOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    return nutri && nutri.pacientes.some(pId => pId.toString() === pacienteId);
};

// @desc    Obter o histórico de peso de um paciente
// @route   GET /api/nutri/paciente/:pacienteId/progresso
exports.getProgressoPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        
        const pesoDoc = await Peso.findOne({ userId: pacienteId });
        const paciente = await User.findById(pacienteId).select('detalhesCirurgia metaPeso');

        res.json({
            historico: pesoDoc ? pesoDoc.registros : [],
            detalhes: paciente
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar progresso do paciente.' });
    }
};

// @desc    Obter o diário alimentar de um paciente para uma data específica
// @route   GET /api/nutri/paciente/:pacienteId/diario/:date
exports.getDiarioAlimentarPaciente = async (req, res) => {
    try {
        const { pacienteId, date } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const foodLog = await FoodLog.findOne({ userId: pacienteId, date: date });
        res.json(foodLog || { refeicoes: {} }); // Retorna um objeto vazio se não houver registo
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar diário alimentar do paciente.' });
    }
};