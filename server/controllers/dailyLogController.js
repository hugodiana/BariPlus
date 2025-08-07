const DailyLog = require('../models/dailyLogModel');

// --- Funções do Controller ---

// GET /api/dailylog/today - Buscar o registro do dia atual
exports.getTodayLog = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let log = await DailyLog.findOne({ userId: req.userId, date: today });
        
        if (!log) {
            log = new DailyLog({ 
                userId: req.userId, 
                date: today,
                waterConsumed: 0,
                proteinConsumed: 0
            });
            await log.save();
        }
        
        res.json(log);
    } catch (error) {
        console.error('Erro ao buscar registro diário:', error);
        res.status(500).json({ message: "Erro ao buscar log diário." });
    }
};

// POST /api/dailylog/track - Registrar consumo de água ou proteína
exports.trackConsumption = async (req, res) => {
    try {
        const { type, amount } = req.body;
        
        if (!type || !['water', 'protein'].includes(type) || !amount) {
            return res.status(400).json({ message: 'Tipo (water/protein) e quantidade são obrigatórios.' });
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            return res.status(400).json({ message: 'Quantidade inválida.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const fieldToUpdate = type === 'water' ? 'waterConsumed' : 'proteinConsumed';
        
        const updatedLog = await DailyLog.findOneAndUpdate(
            { userId: req.userId, date: today },
            { $inc: { [fieldToUpdate]: amountNum } },
            { new: true, upsert: true }
        );

        res.json(updatedLog);
    } catch (error) {
        console.error('Erro ao registrar consumo:', error);
        res.status(500).json({ message: "Erro ao registrar consumo." });
    }
};