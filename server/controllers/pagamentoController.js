// server/controllers/pagamentoController.js
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago'); // CORREÇÃO: Importa as classes necessárias
const Nutricionista = require('../models/Nutricionista');

// --- CORREÇÃO: Nova forma de configurar o cliente ---
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// @desc    Gerar um link de pagamento para uma vaga de paciente adicional
// @route   POST /api/nutri/pagamentos/criar-preferencia
exports.criarPreferenciaVaga = async (req, res) => {
    const nutricionistaId = req.nutricionista.id;

    try {
        const preference = new Preference(client);

        const body = {
            items: [
                {
                    id: `vaga_adicional_${nutricionistaId}`,
                    title: 'Vaga Adicional de Paciente - BariPlus',
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: 10.00
                }
            ],
            payer: {
                email: req.nutricionista.email,
            },
            back_urls: {
                success: `${process.env.NUTRI_CLIENT_URL}/pacientes?pagamento=sucesso`,
                failure: `${process.env.NUTRI_CLIENT_URL}/pacientes?pagamento=falha`,
            },
            auto_return: 'approved',
            external_reference: nutricionistaId,
            notification_url: `${process.env.API_URL}/api/pagamentos/webhook-mercadopago`
        };

        const result = await preference.create({ body });
        res.json({ id: result.id, checkoutUrl: result.init_point });

    } catch (error) {
        console.error("Erro ao criar preferência no Mercado Pago:", error);
        res.status(500).json({ message: 'Erro ao gerar link de pagamento.' });
    }
};

// @desc    Receber o webhook de confirmação do Mercado Pago
// @route   POST /api/pagamentos/webhook-mercadopago
exports.handleMercadoPagoWebhook = async (req, res) => {
    const paymentQuery = req.query;
    console.log('--- NOVO WEBHOOK DO MERCADO PAGO RECEBIDO ---', paymentQuery);

    try {
        if (paymentQuery.type === 'payment') {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentQuery['data.id'] });
            
            console.log('Detalhes do Pagamento:', JSON.stringify(paymentInfo, null, 2));

            if (paymentInfo.status === 'approved' && paymentInfo.external_reference) {
                const nutricionistaId = paymentInfo.external_reference;

                await Nutricionista.findByIdAndUpdate(nutricionistaId, {
                    $inc: { limiteGratis: 1 } 
                });

                console.log(`Vaga adicional concedida ao nutricionista ID: ${nutricionistaId}`);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Erro ao processar webhook do Mercado Pago:", error);
        res.sendStatus(500);
    }
};