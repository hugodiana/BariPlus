const Medication = require('../models/medicationModel');
const MedicationLog = require('../models/medicationLogModel');

// GET /api/medication - Buscar os medicamentos e o histórico
exports.getMedication = async (req, res) => {
    try {
        let doc = await Medication.findOne({ userId: req.userId });
        if (!doc) {
            doc = new Medication({ userId: req.userId, medicamentos: [], historico: {} });
            await doc.save();
        }
        
        const plainDoc = doc.toObject();
        res.json({
            ...plainDoc,
            historico: plainDoc.historico || {}
        });

    } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    }
};

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
            log = { date, dosesTomadas: [] }; // Retorna um log vazio se não existir
        }
        res.json(log);
    } catch (error) {
        console.error('Erro ao buscar log de medicação:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico do dia.' });
    }
};

// POST /api/medication/log/toggle - Adicionar ou remover uma dose
exports.toggleDoseTaken = async (req, res) => {
    try {
        const { date, doseInfo } = req.body; // doseInfo = { medicationId, nome, horario, dosagem }

        if (!date || !doseInfo || !doseInfo.medicationId || !doseInfo.horario) {
            return res.status(400).json({ message: 'Dados insuficientes para registrar a dose.' });
        }

        const log = await MedicationLog.findOne({ userId: req.userId, date });

        // Verifica se a dose já foi registrada
        const doseIndex = log ? log.dosesTomadas.findIndex(d => 
            d.medicationId.toString() === doseInfo.medicationId && d.horario === doseInfo.horario
        ) : -1;

        let updatedLog;

        if (doseIndex > -1) {
            // Se a dose existe, remove (desmarca)
            updatedLog = await MedicationLog.findOneAndUpdate(
                { userId: req.userId, date },
                { $pull: { dosesTomadas: { _id: log.dosesTomadas[doseIndex]._id } } },
                { new: true }
            );
        } else {
            // Se a dose não existe, adiciona (marca)
            updatedLog = await MedicationLog.findOneAndUpdate(
                { userId: req.userId, date },
                { $push: { dosesTomadas: doseInfo } },
                { new: true, upsert: true } // upsert: true cria o log do dia se ele não existir
            );
        }

        res.status(200).json(updatedLog);
    } catch (error) {
        console.error('Erro ao registrar/desmarcar dose:', error);
        res.status(500).json({ message: 'Erro ao processar a dose.' });
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

// ✅ FUNÇÃO CORRIGIDA FINAL: Registrar a toma de um medicamento
exports.logMedication = async (req, res) => {
    try {
        const { date, medId, count } = req.body;

        // A "notação de ponto" é a forma correta de dizer ao MongoDB para navegar
        // até ao campo exato que queremos atualizar, sem tocar no resto.
        const fieldToUpdate = `historico.${date}.${medId}`;
        
        const updatedDoc = await Medication.findOneAndUpdate(
            { userId: req.userId },
            // O operador $set garante que apenas este campo seja atualizado ou criado.
            // Isto evita a validação de outros campos do documento (como o medicamento com erro).
            { $set: { [fieldToUpdate]: parseInt(count) } },
            // new: true retorna o documento atualizado; upsert: true cria o documento se ele não existir.
            { new: true, upsert: true }
        );

        // Retorna o histórico da data específica para manter o frontend sincronizado.
        const updatedHistoryForDate = updatedDoc.historico.get(date) || new Map();
        const responseJSON = Object.fromEntries(updatedHistoryForDate.entries());
        
        res.json(responseJSON);

    } catch (error) {
        console.error("Erro detalhado ao registrar medicação:", error); 
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