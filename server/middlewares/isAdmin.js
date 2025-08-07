const User = require('../models/userModel');

const isAdmin = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.userId);
        if (usuario && usuario.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: "Acesso negado. Rota exclusiva para administradores." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar permissões de admin." });
    }
};

module.exports = isAdmin;