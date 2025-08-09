require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const conquistasRoutes = require('./routes/conquistasRoutes');
const tacoRoutes = require('./routes/tacoRoutes');
const conteudoRoutes = require('./routes/conteudoRoutes');

// ✅ IMPORTAÇÃO DOS MIDDLEWARES E MODELOS NECESSÁRIOS
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
const Conteudo = require('./models/conteudoModel');

const app = express();
app.set('trust proxy', 1);

// --- 1. CONFIGURAÇÃO DE MIDDLEWARES ---
const whitelist = [
    'https://bariplus.vercel.app', 'https://bari-plus.vercel.app',
    'https://bariplus-admin.vercel.app', 'https://bariplus-app.onrender.com',
    'https://bariplus-admin.onrender.com', 'http://localhost:3000',
    'http://localhost:3001', 'http://localhost:3002',
    'https://www.bariplus.com.br', 'https://bariplus.com.br',
    'https://bariplus-app.netlify.app'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet());

// --- 2. WEBHOOK DA KIWIFY ---
app.post('/api/kiwify-webhook', express.json(), async (req, res) => {
    try {
        const kiwifyEvent = req.body;

        // --- LÓGICA PARA PAGAMENTO APROVADO ---
        if (kiwifyEvent.order_status === 'paid') {
            const customer = kiwifyEvent.Customer;
            if (!customer || !customer.email) { /* ... */ }

            const userEmail = customer.email.toLowerCase();
            const userName = customer.full_name;
            let usuario = await User.findOne({ email: userEmail });

            if (usuario) {
                usuario.pagamentoEfetuado = true;
                await usuario.save();
                console.log(`Acesso atualizado para o usuário existente: ${userEmail}`);
            } else {
                // ... (lógica para criar novo usuário)
                await novoUsuario.save();
                
                // ... (lógica para criar documentos padrão: Peso, Checklist, etc.)

                // ✅ LÓGICA DE ENVIO DE E-MAIL COM LOGS MELHORADOS
                console.log(`A tentar enviar e-mail de boas-vindas para ${userEmail}...`);
                try {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                    
                    const { data, error } = await resend.emails.send({
                        from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                        to: [userEmail],
                        subject: 'Bem-vindo(a) ao BariPlus! Configure o seu acesso.',
                        html: `<h1>Compra Aprovada!</h1><p>Olá, ${userName}!</p><p>O seu acesso ao BariPlus foi liberado. Clique no link abaixo para criar a sua senha de acesso:</p><a href="${setupPasswordLink}">Criar Minha Senha</a>`,
                    });

                    if (error) {
                        // Se houver um erro, ele será impresso nos logs do Render
                        console.error("ERRO DETALHADO DO RESEND:", error);
                    } else {
                        console.log("E-mail de boas-vindas enviado com sucesso! ID:", data.id);
                    }
                } catch (emailError) {
                    console.error("FALHA CRÍTICA AO TENTAR ENVIAR O E-MAIL:", emailError);
                }
            }
        } 
        
        // --- LÓGICA PARA REEMBOLSO OU ESTORNO ---
        else if (kiwifyEvent.order_status === 'refunded' || kiwifyEvent.order_status === 'chargebacked') {
            const customer = kiwifyEvent.Customer;
            const userEmail = customer?.email?.toLowerCase();
            const usuario = await User.findOne({ email: userEmail });
            if (usuario && usuario.pagamentoEfetuado) {
                usuario.pagamentoEfetuado = false;
                await usuario.save();
                console.log(`Acesso REMOVIDO para o usuário ${userEmail} devido a ${kiwifyEvent.order_status}.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Erro no webhook da Kiwify:', error);
        res.sendStatus(500);
    }
});

app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/login', limiter);
app.use('/api/forgot-password', limiter);

// --- 2. CONFIGURAÇÕES DE SERVIÇOS ---
if (process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
        try {
            const encodedKey = process.env.FIREBASE_PRIVATE_KEY;
            const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(decodedKey);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } catch (error) { console.error('Erro ao inicializar Firebase Admin:', error); }
    }
}
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));

// --- 3. ROTAS DA API ---
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
app.use('/api', gastoRoutes);
app.use('/api', conquistasRoutes);
app.use('/api', adminRoutes); // As rotas de admin já estão protegidas internamente
app.use('/api/taco', tacoRoutes);
app.use('/api', conteudoRoutes);

// --- 4. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.DATABASE_URL).then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully');
        server.close(async () => {
            await mongoose.connection.close(false);
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
});