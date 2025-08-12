const Medication = require('../models/medicationModel');

// GET /api/medication - Buscar os medicamentos e o histórico
exports.getMedication = async (req, res) => {
    try {
        let doc = await Medication.findOne({ userId: req.userId });

        if (!doc) {
            // Se o documento não existe, cria um novo e retorna
            doc = new Medication({ userId: req.userId, medicamentos: [], historico: {} });
            await doc.save();
        }

        // ✅ CORREÇÃO: Garante que o histórico seja sempre um objeto JSON válido
        const plainDoc = doc.toObject();
        const historicoJSON = plainDoc.historico || {};

        res.json({
            ...plainDoc,
            historico: historicoJSON
        });

    } catch (error) {
        console.error('Erro ao buscar medicamentos:', error); // Log do erro no servidor
        res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    }
};

// POST /api/medication - Adicionar um novo medicamento
exports.addMedication = async (req, res) => {
    try {
        const { nome, dosagem, quantidade, unidade, frequencia } = req.body;
        
        // ✅ CORREÇÃO: Validação inteligente baseada no tipo de frequência
        if (!nome || !frequencia || !frequencia.tipo) {
            return res.status(400).json({ message: 'Nome e tipo de frequência são obrigatórios.' });
        }
        if (frequencia.tipo === 'Diária' && (!frequencia.horarios || frequencia.horarios.length === 0)) {
            return res.status(400).json({ message: 'Para frequência diária, pelo menos um horário é obrigatório.' });
        }
        if (frequencia.tipo === 'Semanal' && frequencia.diaDaSemana == null) {
            return res.status(400).json({ message: 'Para frequência semanal, o dia da semana é obrigatório.' });
        }

        const novoMedicamento = { 
            nome, dosagem, 
            quantidade: parseInt(quantidade) || 1, 
            unidade, frequencia, status: 'Ativo'
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

// PUT /api/medication/:medId/status - Atualizar o status de um medicamento
exports.updateStatus = async (req, res) => {
    try {
        const { medId } = req.params;
        const { status } = req.body;
        if (!status || !['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }
        const medicationDoc = await Medication.findOne({ userId: req.userId });
        if (!medicationDoc) return res.status(404).json({ message: "Nenhum medicamento encontrado." });
        const med = medicationDoc.medicamentos.id(medId);
        if (!med) return res.status(404).json({ message: "Medicamento não encontrado." });

        med.status = status;
        await medicationDoc.save();
        res.json(med);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar status.' });
    }
};

// POST /api/medication/log - Registrar a toma de um medicamento
exports.logMedication = async (req, res) => {
    try {
        const { date, medId, count } = req.body;
        const fieldToUpdate = `historico.${date}.${medId}`;
        const updatedDoc = await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $set: { [fieldToUpdate]: parseInt(count) } },
            { new: true, upsert: true }
        );
        res.json(updatedDoc.historico.get(date) || {});
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar medicação.' });
    }
};

// DELETE /api/medication/:medId - Apagar um medicamento
exports.deleteMedication = async (req, res) => {
    try {
        const { medId } = req.params;
        await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { medicamentos: { _id: medId } } }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover medicamento.' });
    }
};