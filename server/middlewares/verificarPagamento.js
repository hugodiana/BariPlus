const verificarPagamento = (req, res, next) => {
    // Este middleware deve ser usado DEPOIS do middleware 'autenticar',
    // pois ele depende de `req.user` que o 'autenticar' anexa.
    
    // O middleware 'isAdmin' já protege as rotas de admin, então não precisamos nos preocupar com eles.
    if (req.user && (req.user.pagamentoEfetuado || req.user.role === 'admin')) {
        return next(); // O usuário pagou ou é um admin, pode prosseguir.
    }

    // Se o usuário não pagou, bloqueia o acesso com uma mensagem clara.
    return res.status(403).json({
        message: 'Acesso negado. Sua assinatura não está ativa.',
        code: 'PAYMENT_REQUIRED' // Um código para o front-end identificar o erro, se necessário
    });
};

module.exports = verificarPagamento;