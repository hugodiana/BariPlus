// server/controllers/pacienteDataController.js

const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const FoodLog = require('../models/foodLogModel');
const Nutricionista = require('../models/Nutricionista');
const HydrationLog = require('../models/hydrationLogModel');
const MedicationLog = require('../models/medicationLogModel');
const Exams = require('../models/examsModel');

// Função auxiliar para verificar se o paciente (do app BariPlus) pertence ao nutricionista
const checkBariplusPatientOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    // CORREÇÃO: Verifica na lista correta 'pacientesBariplus'
    return nutri && nutri.pacientesBariplus.some(pId => pId.toString() === pacienteId);
};

// @desc    Obter o histórico de peso de um paciente
// @route   GET /api/nutri/paciente/:pacienteId/progresso
exports.getProgressoPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, pacienteId)) {
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
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const foodLog = await FoodLog.findOne({ userId: pacienteId, date: date });
        res.json(foodLog || { refeicoes: {} });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar diário alimentar do paciente.' });
    }
};

// @desc    Adicionar um comentário a um item do diário
// @route   POST /api/nutri/paciente/:pacienteId/diario/:date/comment
exports.addDiaryComment = async (req, res) => {
    try {
        const { pacienteId, date } = req.params;
        const { mealType, itemId, text } = req.body;
        const nutricionistaId = req.nutricionista.id;
        const nutricionistaName = req.nutricionista.nome;

        if (!await checkBariplusPatientOwnership(nutricionistaId, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const foodLog = await FoodLog.findOne({ userId: pacienteId, date: date });
        if (!foodLog) {
            return res.status(404).json({ message: 'Diário alimentar para esta data não encontrado.' });
        }

        const meal = foodLog.refeicoes[mealType];
        const item = meal ? meal.id(itemId) : null;
        if (!item) {
            return res.status(404).json({ message: 'Item da refeição não encontrado.' });
        }

        const newComment = { authorId: nutricionistaId, authorName: nutricionistaName, text: text };
        item.comments.push(newComment);
        await foodLog.save();

        res.status(201).json(foodLog);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar comentário.' });
    }
};

// @desc    Obter o diário de hidratação de um paciente
// @route   GET /api/nutri/paciente/:pacienteId/hidratacao/:date
exports.getHidratacaoPaciente = async (req, res) => {
    try {
        const { pacienteId, date } = req.params;
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const hydrationLog = await HydrationLog.findOne({ userId: pacienteId, date: date });
        res.json(hydrationLog || { entries: [] });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar diário de hidratação.' });
    }
};

// @desc    Obter o log de medicação de um paciente
// @route   GET /api/nutri/paciente/:pacienteId/medicacao/:date
exports.getMedicacaoPaciente = async (req, res) => {
    try {
        const { pacienteId, date } = req.params;
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const medicationLog = await MedicationLog.findOne({ userId: pacienteId, date: date });
        res.json(medicationLog || { dosesTomadas: [] });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar log de medicação.' });
    }
};

// @desc    Obter os dados de exames de um paciente
// @route   GET /api/nutri/paciente/:pacienteId/exames
exports.getExamesPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkBariplusPatientOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const examsDoc = await Exams.findOne({ userId: pacienteId });
        res.json(examsDoc || { examEntries: [] });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar exames do paciente.' });
    }
};