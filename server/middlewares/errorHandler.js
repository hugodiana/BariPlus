// server/middlewares/errorHandler.js

const winston = require('winston'); // Import Winston

// Configure Winston logger (if not already configured globally)
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        // Add other transports for production (e.g., file, external service)
    ],
});

const errorHandler = (err, req, res, next) => {
    // Define um status code padrão para o erro, se não houver um.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Loga o erro usando Winston
    logger.error(`ERRO: ${err.message}`, { stack: err.stack, path: req.path, method: req.method, ip: req.ip });

    // Envia uma resposta de erro padronizada em formato JSON
    res.json({
        message: err.message,
        // Em ambiente de desenvolvimento, é útil ver a pilha de erros.
        // Em produção, escondemos isso por segurança.
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

module.exports = errorHandler;