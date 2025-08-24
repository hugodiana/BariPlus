const Consulta = require('../models/Consulta');

// --- Funções do Controller ---

// GET /api/consultas - Buscar todas as consultas
exports.getConsultas = async (req, res) => {
    try {
        const consultaDoc = await Consulta.findOne({ userId: req.userId });
        if (!consultaDoc) {
            return res.json([]);
        }
        res.json(consultaDoc.consultas);
    } catch (error) {
        console.error('Erro ao buscar consultas:', error);
        res.status(500).json({ message: 'Erro ao buscar consultas.' });
    }
};

// POST /api/consultas - Adicionar uma nova consulta
exports.addConsulta = async (req, res) => {
    try {
        const { especialidade, data, local, notas, status } = req.body;
        
        if (!especialidade || !data) {
            return res.status(400).json({ message: 'Especialidade e data são obrigatórios.' });
        }

        const novaConsulta = { 
            especialidade, 
            data: new Date(data), 
            local, 
            notas, 
            status: status || 'Agendado' 
        };

        const result = await Consulta.findOneAndUpdate(
            { userId: req.userId },
            { $push: { consultas: novaConsulta } },
            { new: true, upsert: true }
        );

        res.status(201).json(result.consultas[result.consultas.length - 1]);
    } catch (error) {
        console.error('Erro ao agendar consulta:', error);
        res.status(500).json({ message: 'Erro ao agendar consulta.' });
    }
};

// PUT /api/consultas/:consultaId - Atualizar uma consulta
exports.updateConsulta = async (req, res) => {
    try {
        const { consultaId } = req.params;
        const updates = req.body;

        const consultaDoc = await Consulta.findOne({ userId: req.userId });
        if (!consultaDoc) {
            return res.status(404).json({ message: "Histórico de consultas não encontrado." });
        }

        const consulta = consultaDoc.consultas.id(consultaId);
        if (!consulta) {
            return res.status(404).json({ message: "Consulta não encontrada." });
        }

        // Atualiza os campos dinamicamente
        Object.keys(updates).forEach(key => {
            if (key === 'data') {
                consulta[key] = new Date(updates[key]);
            } else {
                consulta[key] = updates[key];
            }
        });

        await consultaDoc.save();
        res.json(consulta);
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        res.status(500).json({ message: "Erro ao editar consulta." });
    }
};

// DELETE /api/consultas/:consultaId - Apagar uma consulta
exports.deleteConsulta = async (req, res) => {
    try {
        const { consultaId } = req.params;
        if (!consultaId) {
            return res.status(400).json({ message: 'ID da consulta é obrigatório.' });
        }

        await Consulta.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { consultas: { _id: consultaId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao cancelar consulta:', error);
        res.status(500).json({ message: "Erro ao cancelar consulta." });
    }
};