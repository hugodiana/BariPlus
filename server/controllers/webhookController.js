// server/controllers/webhookController.js

const User = require('../models/userModel');
const Nutricionista = require('../models/Nutricionista'); // Importa o modelo do Nutricionista
const Checklist = require('../models/checklistModel');
const Peso = require('../models/pesoModel');
const Consulta = require('../models/consultaModel');
const DailyLog = require('../models/dailyLogModel');
const Medication = require('../models/medicationModel');
const FoodLog = require('../models/foodLogModel');
const Gasto = require('../models/gastoModel');
const Exams = require('../models/examsModel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handleKiwifyWebhook = async (req, res) => {
    console.log('--- NOVO EVENTO DO WEBHOOK KIWIFY RECEBIDO ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Corpo do Evento (Body):', JSON.stringify(req.body, null, 2));

    try {
        const kiwifyEvent = req.body;
        const customerEmail = kiwifyEvent.Customer?.email?.toLowerCase();
        const productId = kiwifyEvent.prod_id;

        if (!customerEmail) {
            console.log('Webhook recebido sem e-mail do cliente.');
            return res.sendStatus(400);
        }

        // --- LÓGICA PARA ASSINATURAS DE NUTRICIONISTAS ---
        if (productId === process.env.KIWIFY_PRODUCT_ID_NUTRI) {
            const nutricionista = await Nutricionista.findOne({ email: customerEmail });
            if (!nutricionista) {
                console.log(`Webhook de assinatura recebido para um e-mail de nutricionista não cadastrado: ${customerEmail}`);
                return res.status(404).send('Nutricionista não encontrado.');
            }

            let novoStatus = 'inativa';
            if (['paid', 'active'].includes(kiwifyEvent.subscription_status)) {
                novoStatus = 'ativa';
            } else if (['canceled', 'expired', 'refunded'].includes(kiwifyEvent.subscription_status)) {
                novoStatus = 'cancelada';
            }
            
            nutricionista.assinatura.id = kiwifyEvent.subscription_id;
            nutricionista.assinatura.status = novoStatus;
            
            if (novoStatus === 'ativa') {
                switch (productId) {
                    case process.env.KIWIFY_PRODUCT_ID_NUTRI_PROFISSIONAL:
                        nutricionista.assinatura.plano = 'profissional';
                        nutricionista.limiteGratis = 20;
                        break;
                    case process.env.KIWIFY_PRODUCT_ID_NUTRI_CLINICA:
                        nutricionista.assinatura.plano = 'clinica';
                        nutricionista.limiteGratis = 100; // Por exemplo
                        break;
                    default:
                        console.log(`Webhook de assinatura recebido para produto não reconhecido: ${productId}`);
                }
            }
            
            await nutricionista.save();
            console.log(`Assinatura do nutricionista ${customerEmail} atualizada para o plano ${nutricionista.assinatura.plano}, status: ${novoStatus}`);

        } else if (productId === process.env.KIWIFY_PRODUCT_ID_PACIENTE) {
            if (kiwifyEvent.order_status === 'paid') {
                const userName = kiwifyEvent.Customer.full_name || 'Novo Usuário';
                let usuario = await User.findOne({ email: customerEmail });
                let isNewUser = false;

                if (!usuario) {
                    isNewUser = true;
                    const temporaryPassword = crypto.randomBytes(16).toString('hex');
                    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
                    
                    usuario = new User({
                        nome: userName.split(' ')[0],
                        sobrenome: userName.split(' ').slice(1).join(' '),
                        email: customerEmail,
                        password: hashedPassword,
                        isEmailVerified: true,
                    });
                }

                usuario.pagamentoEfetuado = true;
                usuario.kiwifySubscriptionId = kiwifyEvent.order_id;
                await usuario.save();
                
                if (isNewUser) {
                    await Promise.all([
                        new Checklist({ userId: usuario._id }).save(),
                        new Peso({ userId: usuario._id }).save(),
                        new Consulta({ userId: usuario._id }).save(),
                        new DailyLog({ userId: usuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                        new Medication({ userId: usuario._id }).save(),
                        new FoodLog({ userId: usuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                        new Gasto({ userId: usuario._id }).save(),
                        new Exams({ userId: usuario._id }).save()
                    ]);

                    const resetToken = crypto.randomBytes(32).toString('hex');
                    usuario.resetPasswordToken = resetToken;
                    usuario.resetPasswordExpires = Date.now() + 24 * 3600000;
                    await usuario.save();
                    
                    const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                    const emailHtml = emailTemplate('Bem-vindo(a) ao BariPlus!', `Sua compra foi aprovada. Clique no botão abaixo para criar sua senha.`, 'Criar Minha Senha', setupPasswordLink);

                    await resend.emails.send({ from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`, to: [customerEmail], subject: 'Bem-vindo(a) ao BariPlus!', html: emailHtml });
                }
            }
        }

        res.sendStatus(200);

    } catch (error) {
        console.error('--- ERRO CRÍTICO NO WEBHOOK KIWIFY ---:', error);
        res.sendStatus(500);
    }
};