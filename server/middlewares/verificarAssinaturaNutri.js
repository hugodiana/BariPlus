// server/middlewares/verificarAssinaturaNutri.js
const Nutricionista = require('../models/Nutricionista');

const verificarAssinatura = async (req, res, next) => {
    // Este middleware deve ser usado DEPOIS do 'protectNutri'
    const nutricionistaId = req.nutricionista.id;

    try {
        const nutricionista = await Nutricionista.findById(nutricionistaId);
        
        if (nutricionista && nutricionista.assinatura.status === 'ativa') {
            return next(); // Assinatura ativa, pode prosseguir.
        }

        // Futuramente, podemos adicionar uma verificação de período de trial aqui
        // if (nutricionista.emPeriodoDeTrial) { return next(); }

        return res.status(403).json({
            message: 'Acesso negado. A sua assinatura não está ativa.',
            code: 'SUBSCRIPTION_INACTIVE'
        });

    } catch (error) {
        return res.status(500).json({ message: 'Erro ao verificar a assinatura.' });
    }
};

module.exports = verificarAssinatura;