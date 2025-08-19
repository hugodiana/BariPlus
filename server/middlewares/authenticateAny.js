// server/middlewares/authenticateAny.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Nutricionista = require('../models/Nutricionista');

const authenticateAny = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tenta encontrar como Paciente (User)
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                req.userId = user._id;
                req.user = user;
                return next(); // Encontrou um paciente, avança
            }
            
            // Se não for User, tenta encontrar como Nutricionista
            const nutricionista = await Nutricionista.findById(decoded.id).select('-senha');
            if (nutricionista) {
                req.nutricionista = nutricionista;
                return next(); // Encontrou um nutricionista, avança
            }

            // Se o token for válido mas o ID não corresponder a ninguém
            return res.status(401).json({ message: 'Não autorizado, utilizador não encontrado.' });

        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token encontrado.' });
    }
};

module.exports = authenticateAny;