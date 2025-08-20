require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { Resend } = require('resend');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

// INICIALIZAÇÃO DOS SERVIÇOS
const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTAÇÃO DAS ROTAS
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
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const nutriAuthRoutes = require('./routes/nutriAuthRoutes');
const nutriRoutes = require('./routes/nutriRoutes');
const conviteRoutes = require('./routes/conviteRoutes');
const messageRoutes = require('./routes/messageRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes'); 
const metaRoutes = require('./routes/metaRoutes');
const refeicaoTemplateRoutes = require('./routes/refeicaoTemplateRoutes');
const prontuarioRoutes = require('./routes/prontuarioRoutes');

// IMPORTAÇÃO DE MIDDLEWARES E MODELOS (APENAS O NECESSÁRIO)
const errorHandler = require('./middlewares/errorHandler');
const User = require('./models/userModel'); // Necessário para o Webhook
const webhookController = require('./controllers/webhookController'); // Lógica do webhook movida para um controlador
const { iniciarVerificacaoDeMetas } = require('./services/automationService');

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
    'https://nutri.bariplus.com.br',
    /https:\/\/bariblus-nutri-.*\.vercel\.app$/, 
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.some(url => new RegExp(url).test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido por CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- 2. WEBHOOK DA KIWIFY ---
// A lógica do webhook foi movida para o seu próprio controlador para manter o index.js limpo
app.post('/api/kiwify-webhook', webhookController.handleKiwifyWebhook);


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


// --- 4. ROTAS DA API (ORDEM CORRIGIDA) ---
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', message: 'BariPlus API está saudável!' }));
app.get('/', (req, res) => res.status(200).json({ status: 'ok', message: 'BariPlus API está a correr!' }));

// Rotas do Portal do Nutricionista (mais específicas, vêm primeiro)
app.use('/api/nutri/auth', nutriAuthRoutes);
app.use('/api/nutri', nutriRoutes);
app.use('/api/convites', conviteRoutes);
app.use('/api/nutri/refeicoes', refeicaoTemplateRoutes);
app.use('/api', messageRoutes); 
app.use('/api/nutri/prontuarios', prontuarioRoutes);
app.use('/api/taco', tacoRoutes);

// Rotas do Paciente/Utilizador
app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', pesoRoutes);
app.use('/api', consultaRoutes);
app.use('/api', checklistRoutes);
app.use('/api', foodLogRoutes);
app.use('/api', dailyLogRoutes);
app.use('/api', medicationRoutes);
app.use('/api', examsRoutes);
app.use('/api', gastoRoutes);
app.use('/api', conteudoRoutes);
app.use('/api', conquistasRoutes);
app.use('/api', hydrationRoutes);
app.use('/api', reportRoutes);
app.use('/api', mealPlanRoutes);
app.use('/api', pagamentoRoutes);
app.use('/api', metaRoutes);

// Rota de Admin (geralmente por último antes do errorHandler)
app.use('/api', adminRoutes);


// --- 5. MIDDLEWARE DE TRATAMENTO DE ERROS ---
// Deve ser a ÚLTIMA coisa a ser adicionada com app.use()
app.use(errorHandler);


// --- 6. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.DATABASE_URL)
    .then(() => {
        console.log('Conectado ao MongoDB!');
        iniciarVerificacaoDeMetas();
        const server = app.listen(PORT, () => {
            console.log(`Servidor do BariPlus a correr na porta ${PORT}`);
        });

        process.on('SIGTERM', () => {
            console.log('A receber SIGTERM, a desligar graciosamente');
            server.close(async () => {
                console.log('Servidor HTTP fechado.');
                await mongoose.connection.close(false);
                console.log('Ligação ao MongoDB fechada.');
                process.exit(0);
            });
        });
    })
    .catch(err => console.error('Falha ao conectar ao MongoDB:', err));