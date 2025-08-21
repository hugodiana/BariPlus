// server/controllers/pacienteDataController.js
const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const FoodLog = require('../models/foodLogModel');
const Nutricionista = require('../models/Nutricionista');
const HydrationLog = require('../models/hydrationLogModel');
const MedicationLog = require('../models/medicationLogModel');
const Exams = require('../models/examsModel');

// ✅ FUNÇÃO AUXILIAR ATUALIZADA
const checkBariplusPatientOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId).populate('pacientes', 'statusConta');
    if (!nutri) return false;
    
    const paciente = nutri.pacientes.find(p => p._id.toString() === pacienteId);
    // Garante que o paciente pertence ao nutri E que é um utilizador ativo do app
    return paciente && paciente.statusConta === 'ativo';
};

// @desc    Obter o histórico de peso de um paciente
exports.getProgressoPaciente = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const pesoDoc = await Peso.findOne({ userId: req.params.pacienteId });
        const paciente = await User.findById(req.params.pacienteId).select('detalhesCirurgia metaPeso');
        res.json({ historico: pesoDoc ? pesoDoc.registros : [], detalhes: paciente });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar progresso do paciente.' });
    }
};

// @desc    Obter o diário alimentar de um paciente para uma data específica
exports.getDiarioAlimentarPaciente = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const foodLog = await FoodLog.findOne({ userId: req.params.pacienteId, date: req.params.date });
        res.json(foodLog || { refeicoes: {} });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar diário alimentar.' });
    }
};

// @desc    Adicionar um comentário a um item do diário
exports.addDiaryComment = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const { mealType, itemId, text } = req.body;
        const foodLog = await FoodLog.findOne({ userId: req.params.pacienteId, date: req.params.date });
        if (!foodLog) return res.status(404).json({ message: 'Diário não encontrado.' });
        
        const item = foodLog.refeicoes[mealType]?.id(itemId);
        if (!item) return res.status(404).json({ message: 'Item da refeição não encontrado.' });

        item.comments.push({ authorId: req.nutricionista.id, authorName: req.nutricionista.nome, text });
        await foodLog.save();
        res.status(201).json(foodLog);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar comentário.' });
    }
};

// As funções restantes seguem o mesmo padrão de verificação
exports.getHidratacaoPaciente = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const hydrationLog = await HydrationLog.findOne({ userId: req.params.pacienteId, date: req.params.date });
        res.json(hydrationLog || { entries: [] });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar hidratação.' }); }
};
exports.getMedicacaoPaciente = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const medicationLog = await MedicationLog.findOne({ userId: req.params.pacienteId, date: req.params.date });
        res.json(medicationLog || { dosesTomadas: [] });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar medicação.' }); }
};
exports.getExamesPaciente = async (req, res) => {
    try {
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, req.params.pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const examsDoc = await Exams.findOne({ userId: req.params.pacienteId });
        res.json(examsDoc || { examEntries: [] });
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar exames.' }); }
};