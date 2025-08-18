// server/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Define um status code padrão para o erro, se não houver um.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Loga o erro no console do servidor para depuração (em produção, você poderia usar um logger como Winston)
    console.error(`ERRO: ${err.message}\nSTACK: ${err.stack}`);

    // Envia uma resposta de erro padronizada em formato JSON
    res.json({
        message: err.message,
        // Em ambiente de desenvolvimento, é útil ver a pilha de erros.
        // Em produção, escondemos isso por segurança.
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

module.exports = errorHandler;