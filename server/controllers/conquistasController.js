const User = require('../models/userModel');
const { getTodasAsConquistas } = require('../services/conquistasService');

exports.getMinhasConquistas = async (req, res) => {
    try {
        const usuario = await User.findById(req.userId);
        const todasAsConquistas = getTodasAsConquistas();
        
        const resultado = todasAsConquistas.map(conquista => ({
            ...conquista,
            desbloqueada: usuario.conquistas.includes(conquista.idConquista)
        }));
        
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar conquistas.' });
    }
};