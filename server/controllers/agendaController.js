// server/controllers/agendaController.js
const Agendamento = require('../models/Agendamento');

exports.getAgendamentos = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const agendamentos = await Agendamento.find({ nutricionistaId });
        res.json(agendamentos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
};

exports.createAgendamento = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { pacienteId, pacienteModel, title, start, end, status } = req.body;
        const novoAgendamento = await Agendamento.create({
            nutricionistaId, pacienteId, pacienteModel, title, start, end,
            status: status || 'Agendado'
        });
        res.status(201).json(novoAgendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar agendamento.' });
    }
};

exports.updateAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const nutricionistaId = req.nutricionista.id;
        // ✅ AGORA ACEITA TÍTULO, PACIENTE E NOTAS PARA EDIÇÃO COMPLETA
        const { start, end, status, title, pacienteId, pacienteModel, observacoes } = req.body;

        const agendamento = await Agendamento.findById(id);

        if (!agendamento || agendamento.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        if (start) agendamento.start = start;
        if (end) agendamento.end = end;
        if (status) agendamento.status = status;
        if (title) agendamento.title = title;
        if (pacienteId) agendamento.pacienteId = pacienteId;
        if (pacienteModel) agendamento.pacienteModel = pacienteModel;
        if (observacoes) agendamento.observacoes = observacoes;
        
        await agendamento.save();
        res.json(agendamento);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
    }
};

// ✅ NOVA FUNÇÃO PARA APAGAR UM AGENDAMENTO
exports.deleteAgendamento = async (req, res) => {
    try {
        const { id } = req.params;
        const nutricionistaId = req.nutricionista.id;

        const agendamento = await Agendamento.findOneAndDelete({ 
            _id: id, 
            nutricionistaId: nutricionistaId 
        });

        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou acesso negado.' });
        }
        
        res.status(204).send(); // 204 No Content
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar agendamento.' });
    }
};