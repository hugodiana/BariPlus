// server/controllers/agendaController.js
const Agendamento = require('../models/Agendamento');
const User = require('../models/userModel');
const PacienteNutri = require('../models/PacienteNutri');

// @desc    Buscar todos os agendamentos de um nutricionista
// @route   GET /api/nutri/agenda
exports.getAgendamentos = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const agendamentos = await Agendamento.find({ nutricionistaId });
        res.json(agendamentos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
};

// @desc    Criar um novo agendamento
// @route   POST /api/nutri/agenda
exports.createAgendamento = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { pacienteId, pacienteModel, title, start, end } = req.body;

        const novoAgendamento = await Agendamento.create({
            nutricionistaId,
            pacienteId,
            pacienteModel,
            title,
            start,
            end
        });
        res.status(201).json(novoAgendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar agendamento.' });
    }
};

// @desc    Atualizar um agendamento (ex: arrastar e soltar no calendário)
// @route   PUT /api/nutri/agenda/:id
exports.updateAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const nutricionistaId = req.nutricionista.id;
        const { start, end } = req.body;

        const agendamento = await Agendamento.findById(id);

        if (!agendamento || agendamento.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        agendamento.start = start;
        agendamento.end = end;
        await agendamento.save();
        
        res.json(agendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
    }
};