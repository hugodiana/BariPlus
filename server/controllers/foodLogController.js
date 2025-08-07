const FoodLog = require('../models/foodLogModel');

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
        res.status(201).json(result);
    } catch (error) {
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

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover alimento:', error);
        res.status(500).json({ message: "Erro ao remover alimento." });
    }
};