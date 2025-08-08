const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        // Garante que o header existe e está no formato correto
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token não fornecido ou inválido.' });
        }

        const token = authHeader.split(' ')[1];

        // Verifica e decodifica o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Busca o usuário pelo ID do token
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(403).json({ error: 'Usuário não encontrado.' });
        }

        // Anexa o usuário à requisição para uso posterior
        req.userId = user._id;
        req.user = user;

        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = autenticar;
