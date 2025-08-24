const FoodLog = require('../models/FoodLog');
const DailyLog = require('../models/DailyLog');

// --- Função Auxiliar Interna ---
// Esta função calcula o total de proteínas de um diário e atualiza o DailyLog
const syncProteinWithDailyLog = async (userId, date) => {
    try {
        const foodDiary = await FoodLog.findOne({ userId, date });
        let totalProtein = 0;

        if (foodDiary && foodDiary.refeicoes) {
            Object.values(foodDiary.refeicoes).forEach(meal => {
                meal.forEach(item => {
                    totalProtein += item.nutrients.proteins || 0;
                });
            });
        }

        // Atualiza ou cria o DailyLog com o novo total de proteínas
        await DailyLog.findOneAndUpdate(
            { userId, date },
            { $set: { proteinConsumed: totalProtein } },
            { upsert: true }
        );
        console.log(`Sincronização de proteínas para o usuário ${userId} no dia ${date}: ${totalProtein.toFixed(1)}g`);
    } catch (error) {
        console.error("Erro ao sincronizar proteínas:", error);
    }
};


// --- Funções do Controller ---

// GET /api/food-diary/:date - Buscar o diário alimentar de uma data específica
exports.getDiaryByDate = async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ message: 'Data é obrigatória.' });
        }

        let diario = await FoodLog.findOne({ 
            userId: req.userId, 
            date: date 
        });

        if (!diario) {
            diario = new FoodLog({ 
                userId: req.userId, 
                date: date,
                refeicoes: {
                    cafeDaManha: [],
                    almoco: [],
                    jantar: [],
                    lanches: []
                }
            });
            await diario.save();
        }

        res.json(diario);
    } catch (error) {
        console.error('Erro ao buscar diário alimentar:', error);
        res.status(500).json({ message: "Erro ao buscar diário alimentar." });
    }
};

// POST /api/food-diary/log - Adicionar um alimento a uma refeição
exports.logFood = async (req, res) => {
    try {
        const { date, mealType, food } = req.body;
        const fieldToUpdate = `refeicoes.${mealType}`;

        const result = await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $push: { [fieldToUpdate]: food } },
            { new: true, upsert: true }
        );

        // ✅ NOVIDADE: Após adicionar, sincroniza o total de proteínas
        await syncProteinWithDailyLog(req.userId, date);

        res.status(201).json(result);
    } catch (error) {
        console.error("Erro ao adicionar alimento:", error);
        res.status(500).json({ message: "Erro ao adicionar alimento." });
    }
};

// DELETE /api/food-diary/log/:date/:mealType/:itemId - Apagar um item de uma refeição
exports.deleteFoodLog = async (req, res) => {
    try {
        const { date, mealType, itemId } = req.params;
        
        if (!date || !mealType || !itemId) {
            return res.status(400).json({ message: 'Data, tipo de refeição e ID do item são obrigatórios.' });
        }

        if (!['cafeDaManha', 'almoco', 'jantar', 'lanches'].includes(mealType)) {
            return res.status(400).json({ message: 'Tipo de refeição inválido.' });
        }

        const fieldToUpdate = `refeicoes.${mealType}`;
        await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $pull: { [fieldToUpdate]: { _id: itemId } } }
        );

        // ✅ NOVIDADE: Após apagar, sincroniza novamente o total de proteínas
        await syncProteinWithDailyLog(req.userId, date);

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover alimento:', error);
        res.status(500).json({ message: "Erro ao remover alimento." });
    }
};