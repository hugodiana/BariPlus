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

// ✅ IMPORTAÇÃO DE TODAS AS ROTAS MODULARIZADAS
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

// ✅ IMPORTAÇÃO DOS MIDDLEWARES E MODELOS
const autenticar = require('./middlewares/autenticar');
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

// ✅ CORREÇÃO INICIA AQUI
const whitelist = [
    'https://bariplus.vercel.app', 
    'https://bari-plus.vercel.app',
    'https://bariplus-admin.vercel.app', 
    'https://bariplus-app.onrender.com',
    'https://bariplus-admin.onrender.com', 
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://www.bariplus.com.br', // Domínio principal do app
    'https://bariplus.com.br',     // Variação sem 'www'
    'https://admin.bariplus.com.br', // Domínio do painel de administração
    'https://bariplus-app.netlify.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Este log ajuda a ver no servidor qual origem está a fazer o pedido
        console.log('Requisição recebida da origem:', origin); 
        
        // A lógica agora permite pedidos da whitelist E pedidos sem uma origem definida (como Postman ou outros serviços de servidor)
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error('Origem bloqueada por CORS:', origin); 
            callback(new Error('Não permitido por CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions)); // A configuração corrigida é aplicada aqui
// ✅ CORREÇÃO TERMINA AQUI

app.use(helmet());
app.use(express.json());



// --- 2. WEBHOOK DA KIWIFY ---
app.post('/api/kiwify-webhook', express.json(), async (req, res) => {
    try {
        const kiwifyEvent = req.body;
        const customerEmail = kiwifyEvent.Customer?.email?.toLowerCase();
        const orderStatus = kiwifyEvent.order_status;
        const subscriptionStatus = kiwifyEvent.subscription_status;

        if (!customerEmail) {
            console.log('Webhook da Kiwify recebido sem e-mail do cliente.');
            return res.sendStatus(400);
        }

        // ✅ LÓGICA PARA PAGAMENTO APROVADO
        if (orderStatus === 'paid' || subscriptionStatus === 'active') {
            const userName = kiwifyEvent.Customer.full_name;
            let usuario = await User.findOne({ email: customerEmail });

            if (usuario) {
                // Utilizador já existe, apenas atualiza o status de pagamento
                usuario.pagamentoEfetuado = true;
                usuario.kiwifySubscriptionId = kiwifyEvent.order_id;
                await usuario.save();
                console.log(`Acesso atualizado para o usuário existente: ${customerEmail}`);
                
                // ✅ NOVO: Envia um e-mail de boas-vindas mesmo se o usuário já existir
                const emailHtml = emailTemplate(
                    'Seu Acesso ao BariPlus Foi Liberado!',
                    `Olá, ${usuario.nome}! Confirmamos o seu pagamento. O seu acesso a todas as funcionalidades do BariPlus já está ativo.`,
                    'Aceder à Minha Conta',
                    `${process.env.CLIENT_URL}/login`
                );

                await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [customerEmail],
                    subject: 'Acesso Liberado - BariPlus',
                    html: emailHtml,
                });

            } else {
                // Utilizador não existe, cria uma nova conta
                const resetToken = crypto.randomBytes(32).toString('hex');
                const novoUsuario = new User({
                    nome: userName,
                    email: customerEmail,
                    password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
                    pagamentoEfetuado: true,
                    kiwifySubscriptionId: kiwifyEvent.order_id,
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: Date.now() + 24 * 3600000, // 24 horas
                });
                await novoUsuario.save();

                // Cria os documentos associados (checklist, etc.)
                await Promise.all([
                    new Checklist({ userId: novoUsuario._id }).save(),
                    new Peso({ userId: novoUsuario._id }).save(),
                    new Consulta({ userId: novoUsuario._id }).save(),
                    new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                    new Medication({ userId: novoUsuario._id }).save(),
                    new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                    new Gasto({ userId: novoUsuario._id }).save(),
                    new Exams({ userId: novoUsuario._id }).save()
                ]);
                
                console.log(`Novo usuário criado e acesso concedido: ${customerEmail}`);

                const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                const emailHtml = emailTemplate(
                    'Bem-vindo(a) ao BariPlus! Configure o seu acesso.',
                    `Olá, ${userName}! A sua compra foi aprovada e o seu acesso ao BariPlus foi liberado. Clique no botão abaixo para criar a sua senha de acesso.`,
                    'Criar Minha Senha',
                    setupPasswordLink
                );

                await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [customerEmail],
                    subject: 'Bem-vindo(a) ao BariPlus!',
                    html: emailHtml,
                });
            }
        } 
        // ✅ NOVA LÓGICA PARA ESTORNO, CANCELAMENTO OU EXPIRAÇÃO
        else if (['refunded', 'canceled', 'expired'].includes(orderStatus) || ['canceled', 'expired'].includes(subscriptionStatus)) {
            const usuario = await User.findOne({
                $or: [{ email: customerEmail }, { kiwifySubscriptionId: kiwifyEvent.order_id }]
            });

            if (usuario) {
                usuario.pagamentoEfetuado = false;
                await usuario.save();
                console.log(`Acesso revogado para ${customerEmail} devido ao status: ${orderStatus || subscriptionStatus}`);
            } else {
                console.log(`Recebido status de revogação (${orderStatus || subscriptionStatus}) para um usuário não encontrado: ${customerEmail}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Erro no webhook da Kiwify:', error);
        res.sendStatus(500);
    }
});


// --- 3. CONFIGURAÇÕES DE SERVIÇOS ---
if (process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
        try {
            const encodedKey = process.env.FIREBASE_PRIVATE_KEY;
            const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(decodedKey);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('Firebase Admin inicializado com sucesso.');
        } catch (error) { 
            console.error('Erro ao inicializar Firebase Admin:', error); 
        }
    }
}

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));


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
app.use('/api/taco', autenticar, tacoRoutes);


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