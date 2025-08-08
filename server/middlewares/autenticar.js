const jwt = require('jsonwebtoken');

// Este middleware é rápido pois não consulta a base de dados.
// Ele apenas valida a assinatura e a expiração do Access Token.
const autenticar = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.sendStatus(401); // Não autorizado (sem token)
        }

        // Verifica o Access Token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Anexa os dados do usuário (payload do token) ao objeto de requisição
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        
        next();
    } catch (err) {
        // Se o erro for 'TokenExpiredError', o front-end saberá que precisa de um novo token.
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token de acesso expirado.' });
        }
        // Para outros erros (token inválido, etc.)
        return res.sendStatus(403); 
    }
};

module.exports = autenticar;