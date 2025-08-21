// server/controllers/agendaController.js
const Agendamento = require('../models/Agendamento');
const User = require('../models/userModel');

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
        // ✅ O campo 'status' agora é recebido do frontend
        const { pacienteId, pacienteModel, title, start, end, status } = req.body;

        const novoAgendamento = await Agendamento.create({
            nutricionistaId,
            pacienteId,
            pacienteModel,
            title,
            start,
            end,
            status: status || 'Agendado' // Define 'Agendado' como padrão se não for fornecido
        });
        res.status(201).json(novoAgendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar agendamento.' });
    }
};

// @desc    Atualizar um agendamento
// @route   PUT /api/nutri/agenda/:id
exports.updateAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const nutricionistaId = req.nutricionista.id;
        // ✅ O 'status' agora também pode ser atualizado
        const { start, end, status } = req.body;

        const agendamento = await Agendamento.findById(id);

        if (!agendamento || agendamento.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        // Atualiza apenas os campos que foram fornecidos
        if (start) agendamento.start = start;
        if (end) agendamento.end = end;
        if (status) agendamento.status = status;
        
        await agendamento.save();
        
        res.json(agendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
    }
};