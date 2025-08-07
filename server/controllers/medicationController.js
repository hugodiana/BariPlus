const Medication = require('../models/medicationModel');

// --- Funções do Controller ---

// GET /api/medication - Buscar os medicamentos e o histórico do usuário
exports.getMedication = async (req, res) => {
    try {
        let doc = await Medication.findOne({ userId: req.userId });
        if (!doc) {
            doc = new Medication({ 
                userId: req.userId, 
                medicamentos: [], 
                historico: {} 
            });
            await doc.save();
        }
        res.json(doc);
    } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    }
};

// POST /api/medication - Adicionar um novo medicamento
exports.addMedication = async (req, res) => {
    try {
        const { nome, dosagem, quantidade, unidade, vezesAoDia } = req.body;
        if (!nome || !dosagem || !quantidade || !unidade || !vezesAoDia) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        const novoMedicamento = { 
            nome, 
            dosagem, 
            quantidade: parseInt(quantidade), 
            unidade, 
            vezesAoDia: parseInt(vezesAoDia) 
        };
        const result = await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $push: { medicamentos: novoMedicamento } },
            { new: true, upsert: true }
        );
        res.status(201).json(result.medicamentos[result.medicamentos.length - 1]);
    } catch (error) {
        console.error('Erro ao adicionar medicamento:', error);
        res.status(500).json({ message: 'Erro ao adicionar medicamento.' });
    }
};

// POST /api/medication/log - Registrar a toma de um medicamento
exports.logMedication = async (req, res) => {
    try {
        const { date, medId, count } = req.body;
        if (!date || !medId || count === undefined) {
            return res.status(400).json({ message: 'Data, ID do medicamento e contagem são obrigatórios.' });
        }
        const fieldToUpdate = `historico.${date}.${medId}`;
        const updatedDoc = await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $set: { [fieldToUpdate]: parseInt(count) } },
            { new: true, upsert: true }
        );
        res.json(updatedDoc.historico.get(date) || {});
    } catch (error) {
        console.error('Erro ao registrar medicação:', error);
        res.status(500).json({ message: 'Erro ao registrar medicação.' });
    }
};

// DELETE /api/medication/:medId - Apagar um medicamento
exports.deleteMedication = async (req, res) => {
    try {
        const { medId } = req.params;
        if (!medId) {
            return res.status(400).json({ message: 'ID do medicamento é obrigatório.' });
        }
        await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { medicamentos: { _id: medId } } }
        );
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover medicamento:', error);
        res.status(500).json({ message: 'Erro ao remover medicamento.' });
    }
};