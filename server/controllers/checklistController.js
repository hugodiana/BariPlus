const Checklist = require('../models/checklistModel');

// --- Funções do Controller ---

// GET /api/checklist - Buscar o checklist do usuário
exports.getChecklist = async (req, res) => {
    try {
        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        if (!checklistDoc) {
            // Cria um checklist vazio se o usuário não tiver um
            const newChecklist = new Checklist({ userId: req.userId, preOp: [], posOp: [] });
            await newChecklist.save();
            return res.json(newChecklist);
        }
        res.json(checklistDoc);
    } catch (error) {
        console.error('Erro ao buscar checklist:', error);
        res.status(500).json({ message: 'Erro ao buscar checklist.' });
    }
};

// POST /api/checklist - Adicionar um novo item ao checklist
exports.addItem = async (req, res) => {
    try {
        const { descricao, type } = req.body;
        if (!descricao || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ message: 'Descrição e tipo (preOp/posOp) são obrigatórios.' });
        }

        const novoItem = { descricao, concluido: false };
        const result = await Checklist.findOneAndUpdate(
            { userId: req.userId },
            { $push: { [type]: novoItem } },
            { new: true, upsert: true }
        );

        res.status(201).json(result[type][result[type].length - 1]);
    } catch (error) {
        console.error('Erro ao adicionar item ao checklist:', error);
        res.status(500).json({ message: 'Erro ao adicionar item.' });
    }
};

// PUT /api/checklist/:itemId - Atualizar um item do checklist
exports.updateItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { concluido, descricao, type } = req.body;

        if (!itemId || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ message: 'ID do item e tipo (preOp/posOp) são obrigatórios.' });
        }

        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        if (!checklistDoc) {
            return res.status(404).json({ message: "Checklist não encontrado." });
        }

        const item = checklistDoc[type].id(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item não encontrado." });
        }

        if (descricao !== undefined) item.descricao = descricao;
        if (concluido !== undefined) item.concluido = concluido;

        await checklistDoc.save();
        const novasConquistas = await conquistasService.verificarConquistas(req.userId);
        res.json(item);
    } catch (error) {
        console.error('Erro ao atualizar item do checklist:', error);
        res.status(500).json({ message: "Erro ao atualizar item." });
    }
};

// DELETE /api/checklist/:itemId - Apagar um item do checklist
exports.deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { type } = req.query;

        if (!itemId || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ message: 'ID do item e tipo (preOp/posOp) são obrigatórios.' });
        }

        await Checklist.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { [type]: { _id: itemId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover item do checklist:', error);
        res.status(500).json({ message: "Erro ao apagar item." });
    }
};