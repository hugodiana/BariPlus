const Exams = require('../models/examsModel');

// --- Funções do Controller ---

// GET /api/exams - Buscar todos os dados de exames do usuário
exports.getExams = async (req, res) => {
    try {
        let exams = await Exams.findOne({ userId: req.userId });
        if (!exams) {
            exams = new Exams({ userId: req.userId, examEntries: [] });
            await exams.save();
        }
        res.json(exams);
    } catch (error) {
        console.error("Erro ao buscar exames:", error);
        res.status(500).json({ message: "Erro ao buscar exames." });
    }
};

// POST /api/exams/type - Adicionar um novo tipo de exame
exports.addExamType = async (req, res) => {
    try {
        const { name, unit, refMin, refMax } = req.body;
        // ✅ CORREÇÃO: A variável foi renomeada para corresponder ao que é usado abaixo.
        const novoTipoExame = { name, unit, refMin: refMin || null, refMax: refMax || null, history: [] };
        
        const exams = await Exams.findOneAndUpdate(
            { userId: req.userId },
            { $push: { examEntries: novoTipoExame } }, // ✅ Usa a variável correta
            { new: true, upsert: true }
        );
        res.status(201).json(exams.examEntries[exams.examEntries.length - 1]);
    } catch (error) {
        console.error("Erro ao adicionar tipo de exame:", error);
        res.status(500).json({ message: "Erro ao adicionar tipo de exame." });
    }
};

// POST /api/exams/result/:examEntryId - Adicionar um novo resultado a um exame
exports.addExamResult = async (req, res) => {
    try {
        const { examEntryId } = req.params;
        const { date, value, notes } = req.body;
        const resultData = { date: new Date(date), value: parseFloat(value), notes };

        const exams = await Exams.findOneAndUpdate(
            { "examEntries._id": examEntryId, userId: req.userId },
            { $push: { "examEntries.$.history": resultData } },
            { new: true }
        );
        res.status(201).json(exams);
    } catch (error) {
        console.error("Erro ao adicionar resultado:", error);
        res.status(500).json({ message: "Erro ao adicionar resultado." });
    }
};

// PUT /api/exams/result/:examEntryId/:resultId - Editar um resultado
exports.updateExamResult = async (req, res) => {
    try {
        const { examEntryId, resultId } = req.params;
        const { date, value, notes } = req.body;

        const exams = await Exams.findOne({ userId: req.userId, "examEntries._id": examEntryId });
        if (!exams) return res.status(404).json({ message: "Exame não encontrado." });

        const examEntry = exams.examEntries.id(examEntryId);
        const result = examEntry.history.id(resultId);
        if (!result) return res.status(404).json({ message: "Resultado não encontrado." });

        result.date = new Date(date);
        result.value = parseFloat(value);
        result.notes = notes;
        
        await exams.save();
        res.json(result);
    } catch (error) {
        console.error("Erro ao editar resultado:", error);
        res.status(500).json({ message: "Erro ao editar resultado." });
    }
};

// DELETE /api/exams/result/:examEntryId/:resultId - Apagar um resultado
exports.deleteExamResult = async (req, res) => {
    try {
        const { examEntryId, resultId } = req.params;
        await Exams.findOneAndUpdate(
            { userId: req.userId, "examEntries._id": examEntryId },
            { $pull: { "examEntries.$.history": { _id: resultId } } }
        );
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao apagar resultado:", error);
        res.status(500).json({ message: "Erro ao apagar resultado." });
    }
};