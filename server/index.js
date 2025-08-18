require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const admin = require('firebase-admin');

// ✅ INICIALIZAÇÃO CORRIGIDA: A linha que faltava foi adicionada aqui
const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTAÇÃO DO TEMPLATE DE E-MAIL
const emailTemplate = require('./utils/emailTemplate');

// IMPORTAÇÃO DE TODAS AS ROTAS MODULARIZADAS
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pesoRoutes = require('./routes/pesoRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const foodLogRoutes = require('./routes/foodLogRoutes');
const dailyLogRoutes = require('./routes/dailyLogRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const examsRoutes = require('./routes/examsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const conteudoRoutes = require('./routes/conteudoRoutes');
const tacoRoutes = require('./routes/tacoRoutes');
const conquistasRoutes = require('./routes/conquistasRoutes');
const hydrationRoutes = require('./routes/hydrationRoutes');
const reportRoutes = require('./routes/reportRoutes'); 


// IMPORTAÇÃO DOS MIDDLEWARES E MODELOS
const errorHandler = require('./middlewares/errorHandler');
const User = require('./models/userModel');
const Peso = require('./models/pesoModel');
const Consulta = require('./models/consultaModel');
const Exams = require('./models/examsModel');
const Gasto = require('./models/gastoModel');
const Checklist = require('./models/checklistModel');
const DailyLog = require('./models/dailyLogModel');
const Medication = require('./models/medicationModel');
const FoodLog = require('./models/foodLogModel');

const app = express();
app.set('trust proxy', 1);

// --- 1. CONFIGURAÇÃO DE MIDDLEWARES ---
const whitelist = [
    'https://bariplus.vercel.app', 
    'https://bari-plus.vercel.app',
    'https://bariplus-admin.vercel.app', 
    'https://bariplus-app.onrender.com',
    'https://bariplus-admin.onrender.com', 
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://www.bariplus.com.br',
    'https://bariplus.com.br',
    'https://admin.bariplus.com.br',
    'https://bariplus-app.netlify.app',
    'https://nutri.bariplus.com.br', // Seu domínio final
    /https:\/\/bariblus-nutri-.*\.vercel\.app$/, 
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido por CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());


// --- 2. WEBHOOK DA KIWIFY ---
app.post('/api/kiwify-webhook', express.json(), async (req, res) => {
    console.log('--- NOVO EVENTO DO WEBHOOK KIWIFY RECEBIDO ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Corpo do Evento (Body):', JSON.stringify(req.body, null, 2));

    try {
        const kiwifyEvent = req.body;
        const customerEmail = kiwifyEvent.Customer?.email?.toLowerCase();
        const orderStatus = kiwifyEvent.order_status;
        const subscriptionStatus = kiwifyEvent.subscription_status;

        if (!customerEmail) {
            console.log('Webhook da Kiwify recebido sem e-mail do cliente. Encerrando.');
            return res.sendStatus(400);
        }

        if (orderStatus === 'paid' || subscriptionStatus === 'active') {
            console.log(`Evento de SUCESSO recebido para ${customerEmail}. Status: ${orderStatus || subscriptionStatus}`);
            
            const userName = kiwifyEvent.Customer.full_name || 'Novo Usuário';
            let usuario = await User.findOne({ email: customerEmail });
            let isNewUser = false;

            if (!usuario) {
                isNewUser = true;
                console.log(`Usuário ${customerEmail} não encontrado. Criando nova conta...`);
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
            usuario.kiwifySubscriptionId = kiwifyEvent.order_id || kiwifyEvent.subscription_id;
            await usuario.save();
            console.log(`Acesso concedido e salvo no banco de dados para: ${customerEmail}.`);

            if (isNewUser) {
                console.log(`Criando documentos iniciais para o novo usuário ${customerEmail}...`);
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

                console.log(`Enviando e-mail de configuração de senha para NOVO usuário ${customerEmail}...`);
                const resetToken = crypto.randomBytes(32).toString('hex');
                usuario.resetPasswordToken = resetToken;
                usuario.resetPasswordExpires = Date.now() + 24 * 3600000;
                await usuario.save();
                
                const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                const emailHtml = emailTemplate('Bem-vindo(a) ao BariPlus!', `Sua compra foi aprovada. Clique no botão abaixo para criar sua senha.`, 'Criar Minha Senha', setupPasswordLink);

                await resend.emails.send({ from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`, to: [customerEmail], subject: 'Bem-vindo(a) ao BariPlus!', html: emailHtml });
            
            } else {
                console.log(`Enviando e-mail de confirmação de pagamento para usuário EXISTENTE ${customerEmail}...`);
                
                const loginLink = `${process.env.CLIENT_URL}/login`;
                const emailHtml = emailTemplate(
                    'Seu acesso ao BariPlus foi liberado!',
                    `Olá, ${usuario.nome}! Confirmamos o seu pagamento e o seu acesso a todas as funcionalidades do BariPlus já está ativo.`,
                    'Acessar Minha Conta',
                    loginLink
                );

                await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [customerEmail],
                    subject: 'Acesso Liberado - BariPlus',
                    html: emailHtml,
                });
            }
        }
        else if (['refunded', 'canceled', 'expired'].includes(orderStatus) || ['canceled', 'expired'].includes(subscriptionStatus)) {
            console.log(`Evento de REVOGAÇÃO recebido para ${customerEmail}. Status: ${orderStatus || subscriptionStatus}`);
            const usuario = await User.findOne({ email: customerEmail });

            if (usuario) {
                usuario.pagamentoEfetuado = false;
                await usuario.save();
                console.log(`Acesso revogado para ${customerEmail}.`);
            }
        } else {
            console.log(`Evento com status não tratado recebido: ${orderStatus || subscriptionStatus}. Nenhuma ação tomada.`);
        }

        console.log('Webhook processado com sucesso.');
        res.sendStatus(200);

    } catch (error) {
        console.error('--- ERRO CRÍTICO NO WEBHOOK KIWIFY ---:', error);
        res.sendStatus(500);
    }
});


// --- 3. CONFIGURAÇÕES DE SERVIÇOS ---
if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log('Firebase Admin inicializado com sucesso.');
    } catch (error) {
        console.error('Erro CRÍTICO ao inicializar Firebase Admin:', error);
    }
}


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));


// --- ROTA DE VERIFICAÇÃO DE SAÚDE ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BariPlus API is healthy and awake!' });
});


// --- 4. ROTAS DA API ---
app.get('/', (req, res) => res.status(200).json({ status: 'ok', message: 'BariPlus API is running!' }));
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', pesoRoutes);
app.use('/api', consultaRoutes);
app.use('/api', checklistRoutes);
app.use('/api', foodLogRoutes);
app.use('/api', dailyLogRoutes);
app.use('/api', medicationRoutes);
app.use('/api', examsRoutes);
app.use('/api', adminRoutes);
app.use('/api', gastoRoutes);
app.use('/api', conteudoRoutes);
app.use('/api', conquistasRoutes);
app.use('/api/taco', tacoRoutes);
app.use('/api', hydrationRoutes);
app.use('/api', reportRoutes);
app.use(errorHandler);

// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
const server = app.listen(PORT, () => {
    console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(async () => {
        console.log('HTTP server closed.');
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});