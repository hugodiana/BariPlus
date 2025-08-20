// server/controllers/refeicaoTemplateController.js
const RefeicaoTemplate = require('../models/RefeicaoTemplate');

// @desc    Nutricionista cria um novo template de refeição
// @route   POST /api/nutri/refeicoes/templates
exports.criarTemplate = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { nome, horario, itens } = req.body;
        
        if (!nome || !itens || itens.length === 0) {
            return res.status(400).json({ message: 'Nome e pelo menos um item são obrigatórios.' });
        }

        const novoTemplate = await RefeicaoTemplate.create({
            nutricionistaId,
            nome,
            horario,
            itens
        });
        
        res.status(201).json(novoTemplate);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar template de refeição.', error: error.message });
    }
};

// @desc    Nutricionista lista todos os seus templates de refeição
// @route   GET /api/nutri/refeicoes/templates
exports.listarTemplates = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const templates = await RefeicaoTemplate.find({ nutricionistaId }).sort({ nome: 1 });
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar templates de refeição.' });
    }
};

// @desc    Nutricionista apaga um template de refeição
// @route   DELETE /api/nutri/refeicoes/templates/:id
exports.apagarTemplate = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { id } = req.params;

        const template = await RefeicaoTemplate.findOne({ _id: id, nutricionistaId });

        if (!template) {
            return res.status(404).json({ message: 'Template não encontrado ou acesso negado.' });
        }
        
        await RefeicaoTemplate.findByIdAndDelete(id);

        res.status(204).send(); // 204 No Content
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar template de refeição.' });
    }
};