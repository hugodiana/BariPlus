// server/middlewares/authNutri.js

const jwt = require('jsonwebtoken');
const Nutricionista = require('../models/Nutricionista');

const protectNutri = async (req, res, next) => {
  let token;

  // Verifica se o token está no header 'Authorization' e começa com 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrai o token (remove o 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // Verifica se o token é válido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Busca o nutricionista pelo ID do token e anexa ao request
      // O '-senha' remove o campo da senha da busca
      req.nutricionista = await Nutricionista.findById(decoded.id).select('-senha');

      if (!req.nutricionista) {
          return res.status(401).json({ message: 'Não autorizado, token inválido.' });
      }

      next(); // Continua para a próxima rota/middleware
    } catch (error) {
      res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Não autorizado, nenhum token encontrado.' });
  }
};

module.exports = { protectNutri };