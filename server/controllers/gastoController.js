const Gasto = require('../models/gastoModel');
const { startOfMonth, endOfMonth, parseISO } = require('date-fns'); // ✅ Importação adicionada

// GET /api/gastos - Buscar gastos, com filtro opcional por mês/ano
exports.getGastos = async (req, res) => {
    try {
        const { year, month } = req.query;
        const gastoDoc = await Gasto.findOne({ userId: req.userId });

        if (!gastoDoc) {
            return res.json([]); // Retorna sempre um array vazio
        }

        let gastosParaEnviar = gastoDoc.registros;

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            gastosParaEnviar = gastoDoc.registros.filter(r => {
                const dataRegistro = new Date(r.data);
                return dataRegistro >= startDate && dataRegistro <= endDate;
            });
        }
        
        res.json(gastosParaEnviar.sort((a, b) => new Date(b.data) - new Date(a.data)));

    } catch (error) {
        console.error("Erro ao buscar gastos:", error);
        res.status(500).json({ message: "Erro ao buscar gastos." });
    }
};

// POST /api/gastos - Adicionar um novo gasto
exports.addGasto = async (req, res) => {
    try {
        const { descricao, valor, categoria, data } = req.body;
        const novoRegistro = { 
            descricao, 
            valor: parseFloat(valor), 
            categoria, 
            data: data ? new Date(data) : new Date() 
        };

        const gastoDoc = await Gasto.findOneAndUpdate(
            { userId: req.userId },
            { $push: { registros: novoRegistro } },
            { new: true, upsert: true }
        );
        
        res.status(201).json(gastoDoc.registros[gastoDoc.registros.length - 1]);
    } catch (error) {
        console.error("Erro ao adicionar gasto:", error);
        res.status(500).json({ message: "Erro ao adicionar gasto." });
    }
};

// DELETE /api/gastos/:registroId - Apagar um gasto
exports.deleteGasto = async (req, res) => {
    try {
        const { registroId } = req.params;
        await Gasto.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { registros: { _id: registroId } } }
        );
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao apagar gasto:", error);
        res.status(500).json({ message: "Erro ao apagar gasto." });
    }
};