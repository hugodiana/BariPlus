const Conteudo = require('../models/conteudoModel');

// --- Funções para o App (Leitura) ---

// GET /api/conteudos - Listar todos os conteúdos publicados para os usuários
exports.listarConteudosPublicados = async (req, res) => {
    try {
        const conteudos = await Conteudo.find({ publicado: true }).sort({ createdAt: -1 });
        res.json(conteudos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar conteúdos.' });
    }
};

// GET /api/conteudos/:id - Obter um conteúdo específico pelo ID
exports.getConteudoPorId = async (req, res) => {
    try {
        const conteudo = await Conteudo.findById(req.params.id);
        if (!conteudo || !conteudo.publicado) {
            return res.status(404).json({ message: 'Conteúdo não encontrado.' });
        }
        res.json(conteudo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar conteúdo.' });
    }
};


// --- Funções para o Painel de Admin (Gestão) ---

// POST /api/admin/conteudos - Criar um novo conteúdo
exports.criarConteudo = async (req, res) => {
    try {
        const { titulo, resumo, conteudoCompleto, imagemDeCapa, tipo, publicado } = req.body;
        const novoConteudo = new Conteudo({
            titulo, resumo, conteudoCompleto, imagemDeCapa, tipo, publicado
        });
        await novoConteudo.save();
        res.status(201).json(novoConteudo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar conteúdo.', error });
    }
};

// GET /api/admin/conteudos - Listar TODOS os conteúdos (publicados ou não)
exports.listarTodosConteudosAdmin = async (req, res) => {
    try {
        const conteudos = await Conteudo.find().sort({ createdAt: -1 });
        res.json(conteudos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar conteúdos.' });
    }
};

// PUT /api/admin/conteudos/:id - Atualizar um conteúdo
exports.atualizarConteudo = async (req, res) => {
    try {
        const conteudoAtualizado = await Conteudo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!conteudoAtualizado) {
            return res.status(404).json({ message: 'Conteúdo não encontrado.' });
        }
        res.json(conteudoAtualizado);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar conteúdo.', error });
    }
};

// DELETE /api/admin/conteudos/:id - Apagar um conteúdo
exports.apagarConteudo = async (req, res) => {
    try {
        const conteudoApagado = await Conteudo.findByIdAndDelete(req.params.id);
        if (!conteudoApagado) {
            return res.status(404).json({ message: 'Conteúdo não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar conteúdo.' });
    }
};