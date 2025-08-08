const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.sendStatus(401); // Não autorizado
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ CORREÇÃO: Usamos 'decoded.userId' para coincidir com a criação do token.
        const userExists = await User.findById(decoded.userId);
        
        if (!userExists) {
            return res.sendStatus(403); // Proibido
        }
        
        req.userId = decoded.userId;
        next();
    } catch (err) {
        // Token inválido ou expirado
        return res.sendStatus(403); 
    }
};

module.exports = autenticar;