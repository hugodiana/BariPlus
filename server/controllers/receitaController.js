// server/controllers/receitaController.js
const Receita = require('../models/Receita');

exports.criarReceita = async (req, res) => {
    try {
        const { nome, ingredientes, modoDePreparo } = req.body;
        
        // Calcula os totais da receita
        const totais = ingredientes.reduce((acc, ing) => {
            const ratio = (ing.quantidade || 100) / 100;
            acc.kcal += (ing.alimento.kcal || 0) * ratio;
            acc.protein += (ing.alimento.protein || 0) * ratio;
            acc.carbohydrates += (ing.alimento.carbohydrates || 0) * ratio;
            acc.lipids += (ing.alimento.lipids || 0) * ratio;
            return acc;
        }, { kcal: 0, protein: 0, carbohydrates: 0, lipids: 0 });

        const novaReceita = await Receita.create({
            nutricionistaId: req.nutricionista.id,
            nome, ingredientes, modoDePreparo, totais
        });
        res.status(201).json(novaReceita);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar receita.' });
    }
};

exports.listarReceitas = async (req, res) => {
    try {
        const receitas = await Receita.find({ nutricionistaId: req.nutricionista.id });
        res.json(receitas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar receitas.' });
    }
};

exports.apagarReceita = async (req, res) => {
    try {
        await Receita.findOneAndDelete({ _id: req.params.id, nutricionistaId: req.nutricionista.id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar receita.' });
    }
};