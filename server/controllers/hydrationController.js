const HydrationLog = require('../models/hydrationLogModel');
const DailyLog = require('../models/dailyLogModel');

// Função auxiliar para manter o DailyLog sincronizado
const syncWaterWithDailyLog = async (userId, date) => {
    try {
        const hydrationDiary = await HydrationLog.findOne({ userId, date });
        let totalWater = 0;

        if (hydrationDiary && hydrationDiary.entries) {
            totalWater = hydrationDiary.entries.reduce((sum, entry) => sum + entry.amount, 0);
        }

        await DailyLog.findOneAndUpdate(
            { userId, date },
            { $set: { waterConsumed: totalWater } },
            { upsert: true }
        );
        console.log(`Sincronização de água para ${userId} no dia ${date}: ${totalWater}ml`);
    } catch (error) {
        console.error("Erro ao sincronizar água:", error);
    }
};

// GET /api/hydration/:date - Buscar o diário de hidratação de uma data
exports.getHydrationLogByDate = async (req, res) => {
    try {
        const { date } = req.params;
        let log = await HydrationLog.findOne({ userId: req.userId, date });
        if (!log) {
            log = new HydrationLog({ userId: req.userId, date, entries: [] });
            await log.save();
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar diário de hidratação." });
    }
};

// POST /api/hydration/log - Adicionar um novo registro de bebida
exports.logDrink = async (req, res) => {
    try {
        const { date, entry } = req.body; // entry = { type, amount }
        if (!date || !entry || !entry.amount) {
            return res.status(400).json({ message: 'Dados insuficientes.' });
        }

        const updatedLog = await HydrationLog.findOneAndUpdate(
            { userId: req.userId, date },
            { $push: { entries: entry } },
            { new: true, upsert: true }
        );

        await syncWaterWithDailyLog(req.userId, date);
        res.status(201).json(updatedLog);
    } catch (error) {
        res.status(500).json({ message: "Erro ao registrar bebida." });
    }
};

// DELETE /api/hydration/log/:date/:entryId - Apagar um registro
exports.deleteDrinkLog = async (req, res) => {
    try {
        const { date, entryId } = req.params;
        await HydrationLog.findOneAndUpdate(
            { userId: req.userId, date },
            { $pull: { entries: { _id: entryId } } }
        );

        await syncWaterWithDailyLog(req.userId, date);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar registro." });
    }
};