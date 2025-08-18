// server/middlewares/authNutri.js

const jwt = require('jsonwebtoken');
const Nutricionista = require('../models/Nutricionista');

const protectNutri = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.nutricionista = await Nutricionista.findById(decoded.id).select('-senha');

      if (!req.nutricionista) {
          return res.status(401).json({ message: 'Não autorizado, token inválido.' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, nenhum token encontrado.' });
  }
};

module.exports = { protectNutri };