const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');

// GET /api/medication/list - Buscar apenas a lista de medicamentos
exports.getMedicationList = async (req, res) => {
    try {
        let doc = await Medication.findOne({ userId: req.userId });
        if (!doc) {
            doc = new Medication({ userId: req.userId, medicamentos: [] });
            await doc.save();
        }
        res.json(doc);
    } catch (error) {
        console.error('Erro ao buscar lista de medicamentos:', error);
        res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    }
};

// GET /api/medication/log/:date - Buscar o registro de um dia específico
exports.getMedicationLogByDate = async (req, res) => {
    try {
        const { date } = req.params;
        let log = await MedicationLog.findOne({ userId: req.userId, date });
        if (!log) {
            log = { date, dosesTomadas: [] };
        }
        res.json(log);
    } catch (error) {
        console.error('Erro ao buscar log de medicação:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico do dia.' });
    }
};

// POST /api/medication - Adicionar um novo medicamento
exports.addMedication = async (req, res) => {
    try {
        const { nome, dosagem, quantidade, unidade, frequencia } = req.body;
        
        if (!nome || !frequencia || !frequencia.tipo) {
            return res.status(400).json({ message: 'Nome e tipo de frequência são obrigatórios.' });
        }
        if (frequencia.tipo === 'Diária' && (!frequencia.horarios || frequencia.horarios.length === 0)) {
            return res.status(400).json({ message: 'Para frequência diária, pelo menos um horário é obrigatório.' });
        }
        // ✅ CORREÇÃO: Validação para o novo array de dias da semana
        if (frequencia.tipo === 'Semanal' && (!frequencia.diasDaSemana || frequencia.diasDaSemana.length === 0)) {
            return res.status(400).json({ message: 'Para frequência semanal, pelo menos um dia da semana é obrigatório.' });
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

// ✅ FUNÇÃO CORRIGIDA: Atualizar o status de um medicamento
exports.updateStatus = async (req, res) => {
    try {
        const { medId } = req.params;
        const { status } = req.body;
        if (!status || !['Ativo', 'Inativo'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }

        const result = await Medication.findOneAndUpdate(
            { "userId": req.userId, "medicamentos._id": medId },
            { "$set": { "medicamentos.$.status": status } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Medicamento não encontrado." });
        }
        
        const medAtualizado = result.medicamentos.find(m => m._id.toString() === medId);
        res.json(medAtualizado);

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        res.status(500).json({ message: 'Erro ao atualizar status.' });
    }
};


// POST /api/medication/log/toggle - Adicionar ou remover uma dose
exports.toggleDoseTaken = async (req, res) => {
    try {
        const { date, doseInfo } = req.body;
        if (!date || !doseInfo || !doseInfo.medicationId || !doseInfo.horario) {
            return res.status(400).json({ message: 'Dados insuficientes para registrar a dose.' });
        }
        
        const log = await MedicationLog.findOne({ userId: req.userId, date });

        // CORREÇÃO APLICADA AQUI
        // A comparação de `medicationId` agora é feita convertendo ambos para string para garantir consistência.
        const doseIndex = log ? log.dosesTomadas.findIndex(d => 
            d.medicationId.toString() === doseInfo.medicationId && d.horario === doseInfo.horario
        ) : -1;

        let updatedLog;
        if (doseIndex > -1) {
            // Se a dose já existe, remove-a
            updatedLog = await MedicationLog.findOneAndUpdate(
                { userId: req.userId, date },
                { $pull: { dosesTomadas: { _id: log.dosesTomadas[doseIndex]._id } } },
                { new: true }
            );
        } else {
            // Se a dose não existe, adiciona-a
            updatedLog = await MedicationLog.findOneAndUpdate(
                { userId: req.userId, date },
                { $push: { dosesTomadas: doseInfo } },
                { new: true, upsert: true }
            );
        }
        res.status(200).json(updatedLog);
    } catch (error) {
        console.error('Erro ao registrar/desmarcar dose:', error);
        res.status(500).json({ message: 'Erro ao processar a dose.' });
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
        console.error('Erro ao apagar medicamento:', error);
        res.status(500).json({ message: 'Erro ao remover medicamento.' });
    }
};