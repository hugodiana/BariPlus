require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');const admin = require('firebase-admin');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const translate = require('@iamtraction/google-translate');

const app = express();
app.set('trust proxy', 1);
// --- CONFIGURAÇÃO DE CORS ---
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});

app.use('/api/login', limiter);
app.use('/api/forgot-password', limiter);

app.post('/api/mercadopago-webhook', async (req, res) => {
    // O Mercado Pago envia a informação principal no 'query'
    const { query } = req;
    const topic = query.topic || query.type;
    
    console.log("Webhook Mercado Pago recebido:", { topic, query });

    if (topic === 'payment') {
        const paymentId = query.id || query['data.id'];
        if (paymentId) {
            try {
                // Usamos o ID para buscar os detalhes completos do pagamento de forma segura
                const payment = await new Payment(client).get({ id: paymentId });
                
                // Verificamos o status e a referência externa (nosso userId)
                if (payment && payment.status === 'approved' && payment.external_reference) {
                    const userId = payment.external_reference;
                    await User.findByIdAndUpdate(userId, { pagamentoEfetuado: true });
                    console.log(`Pagamento Mercado Pago APROVADO e verificado para o usuário: ${userId}`);
                }
            } catch (error) {
                console.error('Erro ao processar webhook do Mercado Pago:', error);
            }
        }
    }
    // Respondemos sempre com 200 OK para o Mercado Pago saber que recebemos a notificação
    res.sendStatus(200);
});


app.use(express.json());

// --- INICIALIZAÇÃO DO FIREBASE ADMIN ---
if (process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
        try {
            const encodedKey = process.env.FIREBASE_PRIVATE_KEY;
            const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(decodedKey);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } catch (error) {
            console.error('Erro ao inicializar Firebase Admin:', error);
        }
    }
}

// --- OUTRAS CONFIGURAÇÕES ---
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);


mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));

// --- SCHEMAS E MODELOS ---
const UserSchema = new mongoose.Schema({
    nome: String,
    sobrenome: String,
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    onboardingCompleto: { type: Boolean, default: false },
    detalhesCirurgia: {
        fezCirurgia: String,
        dataCirurgia: Date,
        altura: Number,
        pesoInicial: Number,
        pesoAtual: Number
    },
    pagamentoEfetuado: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'affiliate', 'affiliate_pending'], default: 'user' },
    affiliateCouponCode: String,
    fcmToken: String,
    notificationSettings: {
        appointmentReminders: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true },
        weighInReminders: { type: Boolean, default: true }
    },
    mercadoPagoUserId: String,
    // ✅ CORREÇÃO: Este campo foi movido para dentro do objeto principal
    affiliateProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AffiliateProfile'
    }
}, { timestamps: true });
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const PesoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registros: [{
        peso: Number,
        data: Date,
        fotoUrl: String,
        medidas: {
            // Tronco
            pescoco: Number,
            torax: Number,
            cintura: Number,
            abdomen: Number,
            quadril: Number,
            // Membros
            bracoDireito: Number,
            bracoEsquerdo: Number,
            antebracoDireito: Number,
            antebracoEsquerdo: Number,
            coxaDireita: Number,
            coxaEsquerda: Number,
            panturrilhaDireita: Number,
            panturrilhaEsquerda: Number
        }
    }]
}, { timestamps: true });

const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Map, default: {} } });
const FoodLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: String,
    refeicoes: {
        cafeDaManha: [{
            name: String,
            brand: String,
            portion: Number, // ex: 150 (em gramas)
            nutrients: { calories: Number, proteins: Number, carbs: Number, fats: Number }
        }],
        almoco: [{ name: String, brand: String, portion: Number, nutrients: { calories: Number, proteins: Number, carbs: Number, fats: Number } }],
        jantar: [{ name: String, brand: String, portion: Number, nutrients: { calories: Number, proteins: Number, carbs: Number, fats: Number } }],
        lanches: [{ name: String, brand: String, portion: Number, nutrients: { calories: Number, proteins: Number, carbs: Number, fats: Number } }]
    }
}, { timestamps: true });

const GastoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registros: [{
        descricao: { type: String, required: true },
        valor: { type: Number, required: true },
        data: { type: Date, default: Date.now },
        categoria: { type: String, default: 'Outros' }
    }]
});
const AffiliateProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    whatsapp: String,
    pixKeyType: {
        type: String,
        // CORREÇÃO: Adicionamos os valores corretos
        enum: ['CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória', 'Celular'], 
        required: true
    },
    pixKey: { type: String, required: true },
    couponCode: {
        type: String, // Simplesmente um texto
    },
    // Estatísticas
    totalRevenueInCents: {
        type: Number,
        default: 0,
        min: 0
    },
    salesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commissionRate: {
        type: Number,
        default: 30, // 30% como padrão
        min: 0,
        max: 100
    },
    
    // Status e aprovação
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    statusReason: String, // Motivo de rejeição ou suspensão
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Histórico de pagamentos
    payoutHistory: [{
        date: { type: Date, default: Date.now },
        amountInCents: { 
            type: Number, 
            required: true,
            min: 0 
        },
        receiptUrl: String,
        receiptPublicId: String, // ID do Cloudinary para gerenciamento
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        paymentMethod: { 
            type: String, 
            enum: ['PIX', 'TED', 'DOC'], 
            default: 'PIX' 
        },
        transactionId: String,
        notes: String
    }],
    
    // Configurações
    notificationPreferences: {
        email: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false }
    },
    
    // Auditoria
    lastActivityAt: Date
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para calcular o saldo disponível
AffiliateProfileSchema.virtual('availableBalanceInCents').get(function() {
    const totalPaid = this.payoutHistory.reduce((sum, payout) => sum + payout.amountInCents, 0);
    return this.totalRevenueInCents - totalPaid;
});

// Virtual para formatar o saldo disponível em reais
AffiliateProfileSchema.virtual('availableBalance').get(function() {
    return (this.availableBalanceInCents / 100).toFixed(2);
});

// Indexes para melhor performance
AffiliateProfileSchema.index({ couponCode: 1 });
AffiliateProfileSchema.index({ status: 1 });
AffiliateProfileSchema.index({ userId: 1 }, { unique: true });

// Middleware para validação antes de salvar
AffiliateProfileSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'approved') {
        this.approvedAt = new Date();
    }
    next();
});

const ExamsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Um array com todos os tipos de exame que o usuário monitoriza
    examEntries: [{
        name: { type: String, required: true }, // Ex: "Glicemia em Jejum"
        unit: { type: String, required: true }, // Ex: "mg/dL"
        // O histórico de resultados para este tipo de exame
        history: [{
            date: { type: Date, required: true },
            value: { type: Number, required: true },
            notes: String
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('AffiliateProfile', AffiliateProfileSchema);

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const FoodLog = mongoose.model('FoodLog', FoodLogSchema);
const Gasto = mongoose.model('Gasto', GastoSchema);
const AffiliateProfile = mongoose.model('AffiliateProfile', AffiliateProfileSchema);
const Exams = mongoose.model('Exams', ExamsSchema); // ✅ NOVO MODELO

// --- FUNÇÃO DE VALIDAÇÃO DE SENHA ---
const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>*]/.test(password)) return false;
    return true;
};

// --- MIDDLEWARES ---
const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.sendStatus(401);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userExists = await User.findById(decoded.userId);
        
        if (!userExists) return res.sendStatus(403);
        
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.sendStatus(403);
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.userId);
        if (usuario && usuario.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: "Acesso negado. Rota exclusiva para administradores." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar permissões de admin." });
    }
};

const isAffiliate = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.userId);
        if (usuario && usuario.role === 'affiliate') {
            next();
        } else {
            res.status(403).json({ message: "Acesso negado. Rota exclusiva para afiliados." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar permissões de afiliado." });
    }
};

// --- TRANSPORTER DE E-MAIL ---
const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
        body: req.body,
        params: req.params,
        query: req.query
    });
    next();
});

// --- ROTAS DA API ---
app.post('/api/register', async (req, res) => {
    try {
        const { nome, sobrenome, username, email, password, whatsapp } = req.body;
        
        if (!validatePassword(password)) {
            return res.status(400).json({ message: "A senha não cumpre os requisitos de segurança." });
        }
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 3600000); // 1 hora

        const novoUsuario = new User({
            nome, sobrenome, username, email, whatsapp, password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
        });
        await novoUsuario.save();

        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: novoUsuario.email,
            subject: "Ative a sua Conta no BariPlus",
            html: `<h1>Bem-vindo(a)!</h1><p>Clique no link para ativar sua conta:</p><a href="${verificationLink}">Ativar Conta</a>`,
        });

        // ✅ CORREÇÃO: Passando o 'userId' para cada novo documento
        await Promise.all([
            new Checklist({ userId: novoUsuario._id }).save(),
            new Peso({ userId: novoUsuario._id }).save(),
            new Consulta({ userId: novoUsuario._id }).save(),
            new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
            new Medication({ userId: novoUsuario._id }).save(),
            new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
            new Gasto({ userId: novoUsuario._id }).save(),
            new Exams({ userId: novoUsuario._id, examEntries: [] }).save() // ✅ NOVO

        ]);
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso! Verifique seu e-mail para ativar sua conta.' });
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        if (!usuario.isEmailVerified) {
            return res.status(403).json({ message: 'Sua conta ainda não foi ativada. Por favor, verifique seu e-mail.' });
        }
        const token = jwt.sign({ userId: usuario._id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.get('/api/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const usuario = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ message: "Link de verificação inválido ou expirado." });
        }
        
        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();
        
        res.json({ success: true, message: "E-mail verificado com sucesso!" });
    } catch (error) { 
        console.error("Erro ao verificar e-mail:", error);
        res.status(500).json({ message: "Erro no servidor ao verificar o e-mail." }); 
    }
});


// Rota de Recuperação de Senha
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`[FORGOT-PASSWORD] Solicitação recebida para: ${email}`); // LOG
        
        const usuario = await User.findOne({ email });
        
        if (!usuario) {
            console.log('[FORGOT-PASSWORD] E-mail não encontrado no banco'); // LOG
            return res.json({ message: "Se o e-mail existir, um link foi enviado." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expirationDate = new Date(Date.now() + 3600000); // 1 hora
        
        console.log(`[FORGOT-PASSWORD] Token gerado: ${resetToken}`); // LOG
        console.log(`[FORGOT-PASSWORD] Expira em: ${expirationDate}`); // LOG

        usuario.resetPasswordToken = resetToken;
        usuario.resetPasswordExpires = expirationDate;
        await usuario.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
        console.log(`[FORGOT-PASSWORD] Link gerado: ${resetLink}`); // LOG

        await transporter.sendMail({
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: usuario.email,
            subject: "Redefinição de Senha",
            html: `<p>Clique <a href="${resetLink}">aqui</a> para redefinir sua senha (válido por 1 hora)</p>`
        });
        
        console.log(`[FORGOT-PASSWORD] E-mail enviado para: ${usuario.email}`); // LOG
        res.json({ message: "Link de redefinição enviado com sucesso." });
    } catch (error) {
        console.error('[FORGOT-PASSWORD] Erro:', error); // LOG
        res.status(500).json({ message: "Erro ao processar solicitação." });
    }
});


// Rota de Redefinição de Senha
app.post('/api/reset-password/:token', async (req, res) => {
    try {
        const rawToken = req.params.token;
        const token = decodeURIComponent(rawToken);
        const { password } = req.body;

        console.log(`[RESET-PASSWORD] Tentativa com token: ${token}`); // LOG
        console.log(`[RESET-PASSWORD] Token decodificado: ${token}`); // LOG
        console.log(`[RESET-PASSWORD] Data atual: ${new Date()}`); // LOG

        const usuario = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!usuario) {
            const expiredUser = await User.findOne({ resetPasswordToken: token });
            if (expiredUser) {
                console.log(`[RESET-PASSWORD] Token encontrado mas expirado. Data de expiração: ${expiredUser.resetPasswordExpires}`); // LOG
            } else {
                console.log('[RESET-PASSWORD] Token não encontrado no banco'); // LOG
            }
            return res.status(400).json({ 
                message: "Link inválido ou expirado. Solicite um novo link." 
            });
        }

        console.log(`[RESET-PASSWORD] Usuário encontrado: ${usuario.email}`); // LOG
        console.log(`[RESET-PASSWORD] Token expira em: ${usuario.resetPasswordExpires}`); // LOG

        if (!validatePassword(password)) {
            console.log('[RESET-PASSWORD] Senha não atende aos requisitos'); // LOG
            return res.status(400).json({ 
                message: "A senha não atende aos requisitos mínimos." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();

        console.log(`[RESET-PASSWORD] Senha alterada para usuário: ${usuario.email}`); // LOG
        res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
        console.error('[RESET-PASSWORD] Erro:', error); // LOG
        res.status(500).json({ message: "Erro ao redefinir senha." });
    }
});

app.get('/api/validate-reset-token/:token', async (req, res) => {
    try {
        const token = decodeURIComponent(req.params.token);
        console.log(`[VALIDATE-TOKEN] Token recebido: ${token}`);
        console.log(`[VALIDATE-TOKEN] Hora atual: ${new Date()}`);

        const usuario = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!usuario) {
            const expiredUser = await User.findOne({ resetPasswordToken: token });
            if (expiredUser) {
                console.log(`[VALIDATE-TOKEN] Token expirado. Data: ${expiredUser.resetPasswordExpires}`);
                return res.status(400).json({ valid: false, message: "Link expirado" });
            }
            console.log('[VALIDATE-TOKEN] Token não encontrado');
            return res.status(400).json({ valid: false, message: "Link inválido" });
        }

        console.log(`[VALIDATE-TOKEN] Token válido para: ${usuario.email}`);
        res.json({ valid: true, email: usuario.email });
    } catch (error) {
        console.error('[VALIDATE-TOKEN] Erro:', error);
        res.status(500).json({ valid: false, message: "Erro na validação" });
    }
});

// Rota de Perfil do Usuário
app.get('/api/me', autenticar, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId)
            .select('-password -fcmToken -stripeCustomerId');
            
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota de Onboarding
app.post('/api/onboarding', autenticar, async (req, res) => {
    try {
        const { fezCirurgia, dataCirurgia, altura, pesoInicial } = req.body;
        
        // Validação básica
        if (!fezCirurgia || !altura || !pesoInicial) {
            return res.status(400).json({ 
                message: 'Todos os campos são obrigatórios.' 
            });
        }

        const pesoNum = parseFloat(pesoInicial);
        const alturaNum = parseFloat(altura);

        if (isNaN(pesoNum)) {
            return res.status(400).json({ message: 'Peso inválido.' });
        }

        if (isNaN(alturaNum)) {
            return res.status(400).json({ message: 'Altura inválida.' });
        }

        const detalhes = { 
            fezCirurgia, 
            dataCirurgia: fezCirurgia === 'sim' ? new Date(dataCirurgia) : null, 
            altura: alturaNum, 
            pesoInicial: pesoNum, 
            pesoAtual: pesoNum 
        };

        await User.findByIdAndUpdate(
            req.userId, 
            { 
                $set: { 
                    detalhesCirurgia: detalhes, 
                    onboardingCompleto: true 
                } 
            }
        );

        await Peso.findOneAndUpdate(
            { userId: req.userId }, 
            { 
                $push: { 
                    registros: { 
                        peso: pesoNum, 
                        data: new Date() 
                    } 
                } 
            },
            { upsert: true }
        );

        res.status(200).json({ message: 'Dados salvos com sucesso!' });

    } catch (error) {
        console.error('Erro no onboarding:', error);
        res.status(500).json({ message: 'Erro ao salvar detalhes.' });
    }
});

// Rota para Atualizar Data de Cirurgia
app.put('/api/user/surgery-date', autenticar, async (req, res) => {
    try {
        const { dataCirurgia } = req.body;
        
        if (!dataCirurgia) {
            return res.status(400).json({ message: 'A data da cirurgia é obrigatória.' });
        }

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.userId,
            { $set: { "detalhesCirurgia.dataCirurgia": new Date(dataCirurgia) } },
            { new: true }
        ).select('-password');

        if (!usuarioAtualizado) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json(usuarioAtualizado);

    } catch (error) {
        console.error('Erro ao atualizar data de cirurgia:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// Rota para Registrar Peso
app.post('/api/pesos', autenticar, upload.single('foto'), async (req, res) => {
    try {
        const { 
            peso, cintura, quadril, pescoco, torax, abdomen,
            bracoDireito, bracoEsquerdo, antebracoDireito, antebracoEsquerdo,
            coxaDireita, coxaEsquerda, panturrilhaDireita, panturrilhaEsquerda 
        } = req.body;
        
        if (!peso) {
            return res.status(400).json({ message: 'O peso é obrigatório.' });
        }

        const pesoNum = parseFloat(peso);
        if (isNaN(pesoNum)) {
            return res.status(400).json({ message: 'Peso inválido.' });
        }

        let fotoUrl = '';
        if (req.file) {
            try {
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
                const result = await cloudinary.uploader.upload(dataURI, {
                    resource_type: 'auto',
                    folder: 'bariplus_progress'
                });
                fotoUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Erro no upload da foto:', uploadError);
                return res.status(500).json({ message: 'Erro ao fazer upload da foto.' });
            }
        }
        const novoRegistro = {
            peso: pesoNum,
            data: new Date(),
            fotoUrl,
            medidas: {
                pescoco: parseFloat(pescoco) || null,
                torax: parseFloat(torax) || null,
                cintura: parseFloat(cintura) || null,
                abdomen: parseFloat(abdomen) || null,
                quadril: parseFloat(quadril) || null,
                bracoDireito: parseFloat(bracoDireito) || null,
                bracoEsquerdo: parseFloat(bracoEsquerdo) || null,
                antebracoDireito: parseFloat(antebracoDireito) || null,
                antebracoEsquerdo: parseFloat(antebracoEsquerdo) || null,
                coxaDireita: parseFloat(coxaDireita) || null,
                coxaEsquerda: parseFloat(coxaEsquerda) || null,
                panturrilhaDireita: parseFloat(panturrilhaDireita) || null,
                panturrilhaEsquerda: parseFloat(panturrilhaEsquerda) || null
            }
        };

        // Atualiza o peso atual do usuário
        await User.findByIdAndUpdate(
            req.userId,
            { $set: { "detalhesCirurgia.pesoAtual": pesoNum } }
        );

        // Adiciona o novo registro de peso
        const pesoDoc = await Peso.findOneAndUpdate(
            { userId: req.userId },
            { $push: { registros: novoRegistro } },
            { new: true, upsert: true }
        );

        res.status(201).json(pesoDoc.registros[pesoDoc.registros.length - 1]);

    } catch (error) {
        console.error('Erro ao registrar peso:', error);
        res.status(500).json({ message: 'Erro ao registrar peso.' });
    }
});

app.get('/api/pesos', autenticar, async (req, res) => {
    try {
        const pesoDoc = await Peso.findOne({ userId: req.userId });
        res.json(pesoDoc ? pesoDoc.registros : []);
    } catch (error) {
        console.error('Erro ao buscar histórico de peso:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

app.put('/api/user/profile', autenticar, async (req, res) => {
    try {
        const { nome, sobrenome, whatsapp, detalhesCirurgia } = req.body;

        // Monta o objeto de atualização apenas com os campos fornecidos
        const updateData = {
            nome,
            sobrenome,
            whatsapp,
            'detalhesCirurgia.fezCirurgia': detalhesCirurgia.fezCirurgia,
            'detalhesCirurgia.dataCirurgia': detalhesCirurgia.dataCirurgia,
            'detalhesCirurgia.altura': detalhesCirurgia.altura,
            'detalhesCirurgia.pesoInicial': detalhesCirurgia.pesoInicial,
        };

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true } // 'new: true' retorna o documento atualizado
        ).select('-password');

        if (!usuarioAtualizado) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.json(usuarioAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
    }
});

// --- ROTAS DE CHECKLIST ---
app.get('/api/checklist', autenticar, async (req, res) => {
    try {
        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        res.json(checklistDoc || { preOp: [], posOp: [] });
    } catch (error) {
        console.error('Erro ao buscar checklist:', error);
        res.status(500).json({ message: 'Erro ao buscar checklist.' });
    }
});

app.post('/api/checklist', autenticar, async (req, res) => {
    try {
        const { descricao, type } = req.body;
        
        if (!descricao || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ 
                message: 'Descrição e tipo (preOp/posOp) são obrigatórios.' 
            });
        }

        const novoItem = { descricao, concluido: false };
        const result = await Checklist.findOneAndUpdate(
            { userId: req.userId },
            { $push: { [type]: novoItem } },
            { new: true, upsert: true }
        );

        res.status(201).json(result[type][result[type].length - 1]);
    } catch (error) {
        console.error('Erro ao adicionar item ao checklist:', error);
        res.status(500).json({ message: 'Erro ao adicionar item.' });
    }
});

app.put('/api/checklist/:itemId', autenticar, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { concluido, descricao, type } = req.body;

        if (!itemId || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ 
                message: 'ID do item e tipo (preOp/posOp) são obrigatórios.' 
            });
        }

        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        if (!checklistDoc) {
            return res.status(404).json({ message: "Checklist não encontrado." });
        }

        const item = checklistDoc[type].id(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item não encontrado." });
        }

        if (descricao !== undefined) item.descricao = descricao;
        if (concluido !== undefined) item.concluido = concluido;

        await checklistDoc.save();
        res.json(item);
    } catch (error) {
        console.error('Erro ao atualizar item do checklist:', error);
        res.status(500).json({ message: "Erro ao atualizar item." });
    }
});

app.delete('/api/checklist/:itemId', autenticar, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { type } = req.query;

        if (!itemId || !type || !['preOp', 'posOp'].includes(type)) {
            return res.status(400).json({ 
                message: 'ID do item e tipo (preOp/posOp) são obrigatórios.' 
            });
        }

        await Checklist.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { [type]: { _id: itemId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover item do checklist:', error);
        res.status(500).json({ message: "Erro ao apagar item." });
    }
});

// --- ROTAS DE CONSULTAS ---
app.get('/api/consultas', autenticar, async (req, res) => {
    try {
        const consultaDoc = await Consulta.findOne({ userId: req.userId });
        res.json(consultaDoc ? consultaDoc.consultas : []);
    } catch (error) {
        console.error('Erro ao buscar consultas:', error);
        res.status(500).json({ message: 'Erro ao buscar consultas.' });
    }
});

app.post('/api/consultas', autenticar, async (req, res) => {
    try {
        const { especialidade, data, local, notas } = req.body;
        
        if (!especialidade || !data) {
            return res.status(400).json({ 
                message: 'Especialidade e data são obrigatórios.' 
            });
        }

        const novaConsulta = { 
            especialidade, 
            data: new Date(data), 
            local: local || '', 
            notas: notas || '', 
            status: 'Agendado' 
        };

        const result = await Consulta.findOneAndUpdate(
            { userId: req.userId },
            { $push: { consultas: novaConsulta } },
            { new: true, upsert: true }
        );

        res.status(201).json(result.consultas[result.consultas.length - 1]);
    } catch (error) {
        console.error('Erro ao agendar consulta:', error);
        res.status(500).json({ message: 'Erro ao agendar consulta.' });
    }
});

app.put('/api/consultas/:consultaId', autenticar, async (req, res) => {
    try {
        const { consultaId } = req.params;
        const { especialidade, data, local, notas, status } = req.body;

        if (!consultaId) {
            return res.status(400).json({ message: 'ID da consulta é obrigatório.' });
        }

        const consultaDoc = await Consulta.findOne({ 
            "consultas._id": consultaId, 
            userId: req.userId 
        });

        if (!consultaDoc) {
            return res.status(404).json({ message: "Consulta não encontrada." });
        }

        const consulta = consultaDoc.consultas.id(consultaId);
        if (!consulta) {
            return res.status(404).json({ message: "Consulta não encontrada." });
        }

        if (especialidade) consulta.especialidade = especialidade;
        if (data) consulta.data = new Date(data);
        if (local !== undefined) consulta.local = local;
        if (notas !== undefined) consulta.notas = notas;
        if (status) consulta.status = status;

        await consultaDoc.save();
        res.json(consulta);
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        res.status(500).json({ message: "Erro ao editar consulta." });
    }
});

app.delete('/api/consultas/:consultaId', autenticar, async (req, res) => {
    try {
        const { consultaId } = req.params;

        if (!consultaId) {
            return res.status(400).json({ message: 'ID da consulta é obrigatório.' });
        }

        await Consulta.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { consultas: { _id: consultaId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao cancelar consulta:', error);
        res.status(500).json({ message: "Erro ao cancelar consulta." });
    }
});

// --- ROTAS DE REGISTRO DIÁRIO ---
app.get('/api/dailylog/today', autenticar, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let log = await DailyLog.findOne({ userId: req.userId, date: today });
        
        if (!log) {
            log = new DailyLog({ 
                userId: req.userId, 
                date: today,
                waterConsumed: 0,
                proteinConsumed: 0
            });
            await log.save();
        }
        
        res.json(log);
    } catch (error) {
        console.error('Erro ao buscar registro diário:', error);
        res.status(500).json({ message: "Erro ao buscar log diário." });
    }
});

app.post('/api/dailylog/track', autenticar, async (req, res) => {
    try {
        const { type, amount } = req.body;
        
        if (!type || !['water', 'protein'].includes(type) || !amount) {
            return res.status(400).json({ 
                message: 'Tipo (water/protein) e quantidade são obrigatórios.' 
            });
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            return res.status(400).json({ message: 'Quantidade inválida.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const fieldToUpdate = type === 'water' ? 'waterConsumed' : 'proteinConsumed';
        
        const updatedLog = await DailyLog.findOneAndUpdate(
            { userId: req.userId, date: today },
            { $inc: { [fieldToUpdate]: amountNum } },
            { new: true, upsert: true }
        );

        res.json(updatedLog);
    } catch (error) {
        console.error('Erro ao registrar consumo:', error);
        res.status(500).json({ message: "Erro ao registrar consumo." });
    }
});

// --- ROTAS DE MEDICAÇÃO ---
app.get('/api/medication', autenticar, async (req, res) => {
    try {
        let doc = await Medication.findOne({ userId: req.userId });
        
        if (!doc) {
            doc = new Medication({ 
                userId: req.userId, 
                medicamentos: [], 
                historico: {} 
            });
            await doc.save();
        }
        
        res.json(doc);
    } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        res.status(500).json({ message: 'Erro ao buscar medicamentos.' });
    }
});

app.post('/api/medication', autenticar, async (req, res) => {
    try {
        const { nome, dosagem, quantidade, unidade, vezesAoDia } = req.body;
        
        if (!nome || !dosagem || !quantidade || !unidade || !vezesAoDia) {
            return res.status(400).json({ 
                message: 'Todos os campos são obrigatórios.' 
            });
        }

        const novoMedicamento = { 
            nome, 
            dosagem, 
            quantidade: parseInt(quantidade), 
            unidade, 
            vezesAoDia: parseInt(vezesAoDia) 
        };

        const result = await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $push: { medicamentos: novoMedicamento } },
            { new: true, upsert: true }
        );

        res.status(201).json(result.medicamentos[result.medicamentos.length - 1]);
    } catch (error) {
        console.error('Erro ao adicionar medicamento:', error);
        res.status(500).json({ message: 'Erro ao adicionar medicamento.' });
    }
});

app.post('/api/medication/log', autenticar, async (req, res) => {
    try {
        const { date, medId, count } = req.body;
        
        if (!date || !medId || count === undefined) {
            return res.status(400).json({ 
                message: 'Data, ID do medicamento e contagem são obrigatórios.' 
            });
        }

        const fieldToUpdate = `historico.${date}.${medId}`;
        const updatedDoc = await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $set: { [fieldToUpdate]: parseInt(count) } },
            { new: true, upsert: true }
        );

        res.json(updatedDoc.historico.get(date) || {});
    } catch (error) {
        console.error('Erro ao registrar medicação:', error);
        res.status(500).json({ message: 'Erro ao registrar medicação.' });
    }
});

app.delete('/api/medication/:medId', autenticar, async (req, res) => {
    try {
        const { medId } = req.params;
        
        if (!medId) {
            return res.status(400).json({ message: 'ID do medicamento é obrigatório.' });
        }

        await Medication.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { medicamentos: { _id: medId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover medicamento:', error);
        res.status(500).json({ message: 'Erro ao remover medicamento.' });
    }
});



/// Rota de Checkout do Stripe
app.post('/api/create-checkout-session', autenticar, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        let stripeCustomerId = usuario.stripeCustomerId;

        // Cria o cliente no Stripe se não existir
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: usuario.email,
                name: `${usuario.nome} ${usuario.sobrenome}`,
                metadata: { userId: usuario._id.toString() }
            });
            stripeCustomerId = customer.id;
            
            // Atualiza o usuário com o ID do cliente Stripe
            await User.findByIdAndUpdate(
                req.userId,
                { stripeCustomerId }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            mode: 'payment',
            customer: stripeCustomerId,
            allow_promotion_codes: true,
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            }],
            success_url: `${process.env.CLIENT_URL}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/planos`,
            metadata: {
                userId: usuario._id.toString()
            }
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        res.status(500).json({ 
            error: { 
                message: error.message,
                code: error.code || 'internal_error'
            } 
        });
    }
});

app.post('/api/verify-payment-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: "ID da sessão não fornecido." });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Se a sessão foi paga, atualizamos nosso banco de dados
        if (session.payment_status === 'paid' && session.customer) {
            const stripeCustomerId = session.customer;
            await User.findOneAndUpdate(
                { stripeCustomerId: stripeCustomerId },
                { pagamentoEfetuado: true }
            );
            console.log(`Pagamento verificado e confirmado para ${stripeCustomerId}`);
            return res.json({ paymentVerified: true });
        }
        
        return res.json({ paymentVerified: false });
    } catch (error) {
        console.error("Erro ao verificar sessão de pagamento:", error);
        res.status(500).json({ message: "Erro ao verificar pagamento." });
    }
});

// --- ROTAS DE ADMINISTRAÇÃO ---
app.get('/api/admin/users', autenticar, isAdmin, async (req, res) => {
    try {
        // Busca todos os usuários e remove a senha do retorno
        const todosOsUsuarios = await User.find().select('-password');
        res.json(todosOsUsuarios);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

app.post('/api/admin/grant-access/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params; // ID do usuário que receberá o acesso

        const usuario = await User.findByIdAndUpdate(
            userId,
            { $set: { pagamentoEfetuado: true } },
            { new: true } // Retorna o documento atualizado
        ).select('-password');

        if (!usuario) {
            return res.status(404).json({ message: "Usuário a ser atualizado não foi encontrado." });
        }

        console.log(`Acesso concedido ao usuário ${usuario.email} pelo administrador.`);
        res.json(usuario); // Retorna o usuário atualizado

    } catch (error) {
        console.error("Erro ao conceder acesso:", error);
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.put('/api/user/change-password', autenticar, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Busca o usuário no banco de dados
        const usuario = await User.findById(req.userId);
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // Verifica se a senha atual fornecida está correta
        const isMatch = await bcrypt.compare(currentPassword, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ message: "A senha atual está incorreta." });
        }

        // Criptografa a nova senha e salva no banco de dados
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedNewPassword;
        await usuario.save();

        res.json({ message: "Senha alterada com sucesso!" });

    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Rota para buscar estatísticas do admin
app.get('/api/admin/stats', autenticar, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({ pagamentoEfetuado: true });
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        res.json({
            totalUsers,
            paidUsers,
            newUsersLast7Days
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ message: "Erro no servidor" });
    }
});

// Buscar o diário alimentar de uma data específica
app.get('/api/food-diary/:date', autenticar, async (req, res) => {
    try {
        const { date } = req.params;
        
        if (!date) {
            return res.status(400).json({ message: 'Data é obrigatória.' });
        }

        let diario = await FoodLog.findOne({ 
            userId: req.userId, 
            date: date 
        });

        if (!diario) {
            diario = new FoodLog({ 
                userId: req.userId, 
                date: date,
                refeicoes: {
                    cafeDaManha: [],
                    almoco: [],
                    jantar: [],
                    lanches: []
                }
            });
            await diario.save();
        }

        res.json(diario);
    } catch (error) {
        console.error('Erro ao buscar diário alimentar:', error);
        res.status(500).json({ message: "Erro ao buscar diário alimentar." });
    }
});

app.get('/api/foods/search', autenticar, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "É necessário um termo de busca." });

    try {
        const translation = await translate(query, { from: 'pt', to: 'en' });
        const englishQuery = translation.text;
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(englishQuery)}&api_key=${process.env.USDA_API_KEY}&dataType=Foundation,SR%20Legacy&pageSize=20`;
        
        const response = await axios.get(searchUrl);

        if (!response.data || !Array.isArray(response.data.foods)) return res.json([]);

        // Mapeia e traduz os resultados de volta para português
        const products = await Promise.all(response.data.foods.map(async food => {
            const nutrients = food.foodNutrients;
            const findNutrient = (name) => {
                const nutrient = nutrients.find(n => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
                return nutrient ? nutrient.value : 0; // Retorna 0 se não encontrar
            };
            
            // Traduz o nome do alimento de volta para português
            const translatedDescription = await translate(food.description, { from: 'en', to: 'pt' });

            return {
                id: food.fdcId,
                name: translatedDescription.text,
                brand: food.brandOwner || 'Genérico',
                imageUrl: null,
                nutrients: {
                    calories: findNutrient('Energy'),
                    proteins: findNutrient('Protein'),
                    carbs: findNutrient('Carbohydrate'),
                    fats: findNutrient('Total Lipid (fat)')
                }
            };
        }));
        
        res.json(products);
    } catch (error) {
        console.error("Erro ao buscar na API de alimentos:", error);
        res.status(500).json({ message: "Erro ao comunicar com o serviço de busca de alimentos." });
    }
});

app.post('/api/food-diary/log', autenticar, async (req, res) => {
    try {
        const { date, mealType, food } = req.body;
        const fieldToUpdate = `refeicoes.${mealType}`;
        const result = await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $push: { [fieldToUpdate]: food } },
            { new: true, upsert: true }
        );
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar alimento." });
    }
});

app.delete('/api/food-diary/log/:date/:mealType/:itemId', autenticar, async (req, res) => {
    try {
        const { date, mealType, itemId } = req.params;
        
        if (!date || !mealType || !itemId) {
            return res.status(400).json({ 
                message: 'Data, tipo de refeição e ID do item são obrigatórios.' 
            });
        }

        if (!['cafeDaManha', 'almoco', 'jantar', 'lanches'].includes(mealType)) {
            return res.status(400).json({ 
                message: 'Tipo de refeição inválido.' 
            });
        }

        const fieldToUpdate = `refeicoes.${mealType}`;
        await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $pull: { [fieldToUpdate]: { _id: itemId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover alimento:', error);
        res.status(500).json({ message: "Erro ao remover alimento." });
    }
});

// --- ROTAS DE ADMINISTRAÇÃO ---
app.get('/api/admin/users', autenticar, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const query = search 
            ? {
                $or: [
                    { nome: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            } 
            : {};

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -fcmToken')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        res.json({
            users,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
});

app.post('/api/admin/grant-access/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const usuario = await User.findByIdAndUpdate(
            userId,
            { $set: { pagamentoEfetuado: true } },
            { new: true }
        ).select('-password');

        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // Enviar notificação ao usuário
        if (usuario.fcmToken) {
            try {
                await admin.messaging().send({
                    notification: {
                        title: 'Acesso Liberado!',
                        body: 'Seu acesso ao BariPlus foi ativado com sucesso!'
                    },
                    token: usuario.fcmToken
                });
            } catch (notificationError) {
                console.error('Erro ao enviar notificação:', notificationError);
            }
        }

        res.json({ 
            message: "Acesso concedido com sucesso.",
            usuario
        });
    } catch (error) {
        console.error('Erro ao conceder acesso:', error);
        res.status(500).json({ message: "Erro ao conceder acesso." });
    }
});

// ROTA DE ADMIN: Promover um usuário a afiliado e criar o seu cupom
// Em server/index.js

app.post('/api/admin/promote-to-affiliate/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { couponCode } = req.body;

        if (!couponCode) {
            return res.status(400).json({ message: "O código do cupom é obrigatório." });
        }
        
        // Apenas atualiza o usuário no nosso banco de dados com o código do cupom
        const usuario = await User.findByIdAndUpdate(userId, {
            $set: { 
                role: 'affiliate', 
                affiliateCouponCode: couponCode 
            }
        }, { new: true }).select('-password');
        
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.json({ message: "Usuário promovido a afiliado com sucesso!", usuario });

    } catch (error) {
        console.error("Erro ao promover afiliado:", error);
        res.status(500).json({ message: "Erro ao promover afiliado." });
    }
});


app.post('/api/admin/approve-affiliate/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { couponCode } = req.body;

        // Lógica para criar cupom de 30% no Mercado Pago via API
        // (Simplificado por agora, assumindo que o painel do MP permite criar cupons de percentagem)
        // await mercadopago.coupons.create({ code: couponCode, percent_off: 30 });
        
        const affiliateProfile = await AffiliateProfile.findOneAndUpdate({ userId }, { status: 'approved' });
        const usuario = await User.findByIdAndUpdate(userId, {
            $set: { role: 'affiliate', affiliateCouponCode: couponCode }
        }, { new: true }).select('-password');
        if (usuario) {
            await transporter.sendMail({
                from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
                to: usuario.email,
                subject: "🚀 Parabéns! Você agora é um Afiliado BariPlus!",
                html: `
                    <h1>Olá, ${usuario.nome}!</h1>
                    <p>A sua candidatura para o nosso programa de afiliados foi aprovada com sucesso!</p>
                    <p>O seu cupom de desconto exclusivo para partilhar é: <strong>${couponCode}</strong></p>
                    <p>Você já pode aceder ao seu Portal do Afiliado dentro do aplicativo para acompanhar as suas métricas.</p>
                    <p>Boas vendas!</p>
                `,
            });
        }
        
        res.json({ message: "Afiliado aprovado e notificado com sucesso!", usuario });
    } catch (error) { res.status(500).json({ message: "Erro ao aprovar afiliado." }); }
});

// ✅ NOVA ROTA DE ADMIN: Buscar todos os afiliados e as suas estatísticas
app.get('/api/admin/affiliates', autenticar, isAdmin, async (req, res) => {
    try {
        // Busca todos os usuários afiliados e popula o perfil de afiliado em uma única consulta
        const affiliates = await User.find({ role: 'affiliate' })
            .select('-password') // Remove o campo de senha
            .populate({
                path: 'affiliateProfile',
                select: 'pixKey couponCode totalRevenueInCents salesCount' // Seleciona apenas os campos necessários
            })
            .lean(); // Converte para objeto JavaScript puro

        // Se não existir o populate, fazemos a busca manual
        if (!affiliates[0]?.affiliateProfile) {
            const affiliateUsers = await User.find({ role: 'affiliate' })
                .select('-password')
                .lean();

            const affiliateProfiles = await AffiliateProfile.find({
                userId: { $in: affiliateUsers.map(u => u._id) }
            }).select('userId pixKey couponCode totalRevenueInCents salesCount')
              .lean();

            const profileMap = affiliateProfiles.reduce((acc, profile) => {
                acc[profile.userId] = profile;
                return acc;
            }, {});

            const fullAffiliateData = affiliateUsers.map(user => ({
                ...user,
                profile: profileMap[user._id] || null
            }));

            return res.json(fullAffiliateData);
        }

        // Formata os dados para o frontend
        const formattedAffiliates = affiliates.map(affiliate => ({
            _id: affiliate._id,
            nome: affiliate.name || affiliate.email.split('@')[0],
            email: affiliate.email,
            couponCode: affiliate.affiliateProfile?.couponCode || 'N/A',
            salesCount: affiliate.affiliateProfile?.salesCount || 0,
            totalRevenueInCents: affiliate.affiliateProfile?.totalRevenueInCents || 0,
            profile: {
                pixKey: affiliate.affiliateProfile?.pixKey || 'Não cadastrado',
                ...affiliate.affiliateProfile
            }
        }));

        res.json(formattedAffiliates);
    } catch (error) {
        console.error("Erro ao buscar afiliados:", error);
        res.status(500).json({ 
            message: "Erro ao buscar afiliados.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.post('/api/admin/affiliate-payout/:profileId', autenticar, isAdmin, upload.single('receipt'), async (req, res) => {
    try {
        const { profileId } = req.params;
        const { amount } = req.body;
        let receiptUrl = '';

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "bariplus_payouts" });
            receiptUrl = result.secure_url;
        }

        const payout = { amountInCents: parseFloat(amount) * 100, receiptUrl };
        await AffiliateProfile.findByIdAndUpdate(profileId, { $push: { payoutHistory: payout } });

        res.status(201).json({ message: 'Pagamento de comissão registado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registar pagamento.' });
    }
});


// ✅ NOVA ROTA DE ADMIN: Anexar um comprovativo de pagamento de comissão
app.post('/api/admin/affiliate-payout/:profileId', autenticar, isAdmin, upload.single('receipt'), async (req, res) => {
    try {
        const { profileId } = req.params;
        const { amount } = req.body;
        let receiptUrl = '';

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "bariplus_payouts" });
            receiptUrl = result.secure_url;
        }

        const payout = { amount: parseFloat(amount) * 100, receiptUrl };
        await AffiliateProfile.findByIdAndUpdate(profileId, { $push: { payoutHistory: payout } });

        res.status(201).json({ message: 'Pagamento de comissão registado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registar pagamento.' });
    }
});

app.get('/api/affiliate/stats', autenticar, isAffiliate, async (req, res) => {
    try {
        const affiliateUser = await User.findById(req.userId);
        const couponCode = affiliateUser.affiliateCouponCode;
        if (!couponCode) return res.status(400).json({ message: "Nenhum cupom associado." });

        // ... (lógica para buscar as vendas no Mercado Pago usando o couponCode)
        const affiliateSales = []; // Substituir pela busca real no MP

        const salesCount = affiliateSales.length;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Calcula a comissão apenas sobre as vendas com mais de 7 dias
        const commissionableRevenueInCents = affiliateSales
            .filter(sale => new Date(sale.date_approved) < sevenDaysAgo)
            .reduce((sum, sale) => sum + sale.transaction_amount, 0);
        
        const commissionInCents = commissionableRevenueInCents * 0.30;

        res.json({
            couponCode,
            salesCount,
            commissionInCents,
            salesDetails: affiliateSales.map(s => ({ /* ... */ }))
        });
    } catch (error) { res.status(500).json({ message: "Erro ao buscar estatísticas." }); }
});

// --- ROTAS DE NOTIFICAÇÃO ---
// ✅ ROTAS DE NOTIFICAÇÃO
app.post('/api/user/save-fcm-token', autenticar, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        await User.findByIdAndUpdate(req.userId, { fcmToken: fcmToken });
        res.status(200).json({ message: 'Token salvo com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar token.' });
    }
});

app.post('/api/user/send-test-notification', autenticar, async (req, res) => {
    console.log("--- ROTA DE TESTE DE NOTIFICAÇÃO ATINGIDA ---");
    try {
        console.log("1. Buscando usuário pelo ID:", req.userId);
        const usuario = await User.findById(req.userId);

        if (!usuario) {
            console.error("Usuário não encontrado no banco de dados.");
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        console.log("2. Usuário encontrado:", usuario.email);

        if (usuario && usuario.fcmToken) {
            console.log("3. Token FCM encontrado:", usuario.fcmToken);
            const message = {
                notification: {
                    title: 'Olá do BariPlus! 👋',
                    body: 'Este é o seu teste de notificação. Funcionou!'
                },
                token: usuario.fcmToken
            };

            console.log("4. A preparar para enviar a mensagem...");
            try {
                const response = await admin.messaging().send(message);
                console.log("5. Mensagem enviada com sucesso!", response);
                res.status(200).json({ message: "Notificação de teste enviada com sucesso!" });
            } catch (sendError) {
                // Erro específico do envio do Firebase
                console.error("ERRO DENTRO DO FIREBASE MESSAGING:", sendError);
                res.status(500).json({ message: "Erro específico ao tentar enviar via Firebase." });
            }
        } else {
            console.error("Token FCM não encontrado para este usuário.");
            res.status(404).json({ message: "Token de notificação não encontrado para este usuário." });
        }
    } catch (error) {
        console.error("Erro geral na rota send-test-notification:", error);
        res.status(500).json({ message: "Erro geral no servidor." });
    }
});

app.post('/api/cron/send-appointment-reminders', async (req, res) => {
    const providedSecret = req.headers['authorization']?.split(' ')[1];
    if (providedSecret !== process.env.CRON_JOB_SECRET) {
        return res.status(401).send('Acesso não autorizado.');
    }

    console.log("Cron job de lembretes de consulta iniciado...");
    
    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const depoisDeAmanha = new Date(amanha);
        depoisDeAmanha.setDate(amanha.getDate() + 1);

        // 1. Busca todos os documentos de consulta que têm uma consulta para amanhã
        const consultaDocs = await Consulta.find({
            "consultas.data": { $gte: amanha, $lt: depoisDeAmanha }
        });

        console.log(`Encontrados ${consultaDocs.length} documentos com consultas para amanhã.`);

        // 2. Para cada documento encontrado, processa individualmente
        for (const doc of consultaDocs) {
            const usuario = await User.findById(doc.userId);

            if (usuario && usuario.fcmToken) {
                const consultaDeAmanha = doc.consultas.find(c => new Date(c.data) >= amanha && new Date(c.data) < depoisDeAmanha);

                if (consultaDeAmanha) {
                    const message = {
                        notification: {
                            title: 'Lembrete de Consulta 🗓️',
                            body: `Não se esqueça da sua consulta de ${consultaDeAmanha.especialidade} amanhã!`
                        },
                        token: usuario.fcmToken
                    };
                    
                    try {
                        // Tenta enviar a notificação
                        await admin.messaging().send(message);
                        console.log(`Notificação de lembrete enviada para ${usuario.email}`);
                    } catch (error) {
                        // ✅ CORREÇÃO: Se o erro for 'token não registrado', apaga o token do banco de dados
                        if (error.code === 'messaging/registration-token-not-registered') {
                            console.log(`Token inválido encontrado para ${usuario.email}. Removendo do banco de dados.`);
                            usuario.fcmToken = null;
                            await usuario.save();
                        } else {
                            console.error(`Erro ao enviar notificação para ${usuario.email}:`, error);
                        }
                    }
                }
            }
        }
        res.status(200).send("Lembretes processados.");
    } catch (error) {
        console.error("Erro no cron job de lembretes:", error);
        res.status(500).send("Erro ao processar lembretes.");
    }
});

app.post('/api/cron/send-medication-reminders', async (req, res) => {
    // 1. A mesma verificação de segurança da outra rota
    const providedSecret = req.headers['authorization']?.split(' ')[1];
    if (providedSecret !== process.env.CRON_JOB_SECRET) {
        return res.status(401).send('Acesso não autorizado.');
    }

    console.log("Cron job de lembretes de medicação iniciado...");

    try {
        // 2. Pega a data de hoje no formato "YYYY-MM-DD"
        const hoje = new Date().toISOString().split('T')[0];

        // 3. Busca todos os usuários que têm medicamentos cadastrados
        const usuariosComMedicamentos = await User.find({
            // Podemos adicionar um filtro aqui se quisermos, mas por agora buscamos todos
        });

        console.log(`Verificando ${usuariosComMedicamentos.length} usuários com medicamentos.`);

        for (const usuario of usuariosComMedicamentos) {
            // 4. Para cada usuário, verifica se ele já registrou algum medicamento hoje
            const logDeMedicacao = await Medication.findOne({ userId: usuario._id });

            // Se o log de medicação existe E NÃO tem um registro para hoje
            if (logDeMedicacao && !logDeMedicacao.historico.has(hoje)) {
                
                // 5. Se o usuário tem um token válido, envia a notificação
                if (usuario.fcmToken) {
                    const message = {
                        notification: {
                            title: 'Hora dos seus cuidados! 💊',
                            body: 'Não se esqueça de registrar as suas vitaminas e medicamentos de hoje no BariPlus.'
                        },
                        token: usuario.fcmToken
                    };

                    try {
                        await admin.messaging().send(message);
                        console.log(`Notificação de medicação enviada para ${usuario.email}`);
                    } catch (error) {
                        // Lida com tokens inválidos, como fizemos antes
                        if (error.code === 'messaging/registration-token-not-registered') {
                            console.log(`Token de medicação inválido para ${usuario.email}. Removendo.`);
                            usuario.fcmToken = null;
                            await usuario.save();
                        } else {
                            console.error(`Erro ao enviar notificação de medicação para ${usuario.email}:`, error);
                        }
                    }
                }
            }
        }
        res.status(200).send("Lembretes de medicação processados.");
    } catch (error) {
        console.error("Erro no cron job de medicação:", error);
        res.status(500).send("Erro ao processar lembretes de medicação.");
    }
});

app.post('/api/cron/send-weigh-in-reminders', async (req, res) => {
    // 1. Verificação de segurança
    const providedSecret = req.headers['authorization']?.split(' ')[1];
    if (providedSecret !== process.env.CRON_JOB_SECRET) {
        return res.status(401).send('Acesso não autorizado.');
    }

    console.log("Cron job de lembretes de pesagem semanal iniciado...");

    try {
        // 2. Busca todos os usuários que querem receber este lembrete
        const usuariosParaNotificar = await User.find({
            "notificationSettings.weighInReminders": true,
            fcmToken: { $ne: null } // Apenas usuários com um token de notificação
        });

        console.log(`Encontrados ${usuariosParaNotificar.length} usuários para notificar sobre a pesagem.`);

        // 3. Envia a notificação para cada um
        for (const usuario of usuariosParaNotificar) {
            const message = {
                notification: {
                    title: 'Sua evolução é importante! ⚖️',
                    body: 'Lembrete semanal: Hora de registrar o seu peso e ver a sua evolução no BariPlus!'
                },
                token: usuario.fcmToken
            };

            try {
                await admin.messaging().send(message);
                console.log(`Notificação de pesagem enviada para ${usuario.email}`);
            } catch (error) {
                if (error.code === 'messaging/registration-token-not-registered') {
                    console.log(`Token de pesagem inválido para ${usuario.email}. Removendo.`);
                    usuario.fcmToken = null;
                    await usuario.save();
                } else {
                    console.error(`Erro ao enviar notificação de pesagem para ${usuario.email}:`, error);
                }
            }
        }
        res.status(200).send("Lembretes de pesagem processados.");
    } catch (error) {
        console.error("Erro no cron job de pesagem:", error);
        res.status(500).send("Erro ao processar lembretes de pesagem.");
    }
});

// ✅ NOVIDADE: ROTAS PARA O CONTROLE DE GASTOS
app.get('/api/gastos', autenticar, async (req, res) => {
    try {
        const { year, month } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const gastoDoc = await Gasto.findOne({ userId: req.userId });

        if (!gastoDoc) {
            return res.json([]); // Retorna um array vazio se o usuário ainda não tiver nenhum gasto
        }

        // Filtra os registros dentro do array para o mês selecionado
        const gastosDoMes = gastoDoc.registros.filter(r => {
            const dataRegistro = new Date(r.data);
            return dataRegistro >= startDate && dataRegistro <= endDate;
        });

        res.json(gastosDoMes.sort((a, b) => new Date(b.data) - new Date(a.data)));

    } catch (error) {
        console.error("Erro ao buscar gastos:", error);
        res.status(500).json({ message: "Erro ao buscar gastos." });
    }
});

app.post('/api/gastos', autenticar, async (req, res) => {
    try {
        const { descricao, valor, categoria, data } = req.body;
        const novoRegistro = {
            descricao,
            valor: parseFloat(valor),
            categoria,
            data: data ? new Date(data) : new Date()
        };

        // Encontra o documento de gastos do usuário e adiciona o novo registro ao array
        const gastoDoc = await Gasto.findOneAndUpdate(
            { userId: req.userId },
            { $push: { registros: novoRegistro } },
            { new: true, upsert: true } // 'upsert: true' cria o documento se ele não existir
        );
        
        // Retorna apenas o último registro adicionado
        res.status(201).json(gastoDoc.registros[gastoDoc.registros.length - 1]);
    } catch (error) {
        console.error("Erro ao adicionar gasto:", error);
        res.status(500).json({ message: "Erro ao adicionar gasto." });
    }
});


app.delete('/api/gastos/:id', autenticar, async (req, res) => {
    try {
        await Gasto.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar gasto." });
    }
});

app.get('/api/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const usuario = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            // Redireciona para a página de erro no frontend
            return res.redirect(`${process.env.FRONTEND_URL}/email-verification-error`);
        }

        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();

        // Redireciona para a página de sucesso no frontend
        res.redirect(`${process.env.FRONTEND_URL}/email-verified?success=true`);
        
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}/email-verification-error`);
    }
});

app.post('/api/resend-verification-email', async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await User.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        if (usuario.isEmailVerified) {
            return res.status(400).json({ message: "Este e-mail já foi verificado." });
        }

        // Gera um novo token e data de expiração
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 3600000); // Expira em 1 hora

        usuario.emailVerificationToken = verificationToken;
        usuario.emailVerificationExpires = verificationExpires;
        await usuario.save();
        
        // Reenvia o e-mail
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: usuario.email,
            subject: "Seu Novo Link de Verificação BariPlus",
            html: `<h1>Novo Link de Ativação</h1><p>Aqui está o seu novo link para ativar a sua conta:</p><a href="${verificationLink}">Ativar Minha Conta</a><p>Este link expira em 1 hora.</p>`,
        });

        res.json({ message: "Um novo link de verificação foi enviado para o seu e-mail." });

    } catch (error) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.post('/api/process-payment', autenticar, async (req, res) => {
    try {
        const { token, issuer_id, payment_method_id, transaction_amount, installments, payer } = req.body;

        const paymentData = {
            body: {
                transaction_amount: transaction_amount,
                token: token,
                description: 'BariPlus - Acesso Vitalício',
                installments: installments,
                payment_method_id: payment_method_id,
                payer: {
                    email: payer.email,
                },
                external_reference: req.userId, // ID do nosso usuário
            }
        };

        const paymentResponse = await payment.create(paymentData);
        
        // Se o pagamento for aprovado, atualiza o nosso banco de dados na hora
        if (paymentResponse.status === 'approved') {
            await User.findByIdAndUpdate(req.userId, { pagamentoEfetuado: true });
            console.log(`Pagamento APROVADO via Checkout Bricks para o usuário: ${req.userId}`);
        }

        res.status(201).json({
            status: paymentResponse.status,
            message: paymentResponse.status_detail
        });

    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        const errorMessage = error.cause?.message || "Erro desconhecido ao processar pagamento.";
        res.status(500).json({ message: errorMessage });
    }
});

app.post('/api/verify-payment-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: "ID da sessão não fornecido." });

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid' && session.customer) {
            const stripeCustomerId = session.customer;
            await User.findOneAndUpdate({ stripeCustomerId }, { pagamentoEfetuado: true });
            return res.json({ paymentVerified: true });
        }
        
        return res.json({ paymentVerified: false });
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        res.status(500).json({ message: "Erro ao verificar pagamento." });
    }
});

// ✅ ROTA DE PAGAMENTO ATUALIZADA PARA CRIAR ASSINATURAS
app.post('/api/create-subscription-preference', autenticar, async (req, res) => {
    try {
        const { planType } = req.body;
        const usuario = await User.findById(req.userId);

        let planId;
        let planDetails = {};

        if (planType === 'mensal') {
            planId = process.env.MERCADOPAGO_PLAN_ID_MENSAL;
            planDetails = { title: 'BariPlus - Plano Mensal', price: 49.99 };
        } else if (planType === 'anual') {
            planId = process.env.MERCADOPAGO_PLAN_ID_ANUAL;
            planDetails = { title: 'BariPlus - Plano Anual', price: 120.00 };
        } else {
            return res.status(400).json({ message: "Tipo de plano inválido." });
        }

        const preferenceBody = {
            // ✅ CORREÇÃO: Adicionamos o array 'items' que estava em falta
            items: [{
                title: planDetails.title,
                unit_price: planDetails.price,
                quantity: 1,
                currency_id: 'BRL',
            }],
            preapproval_plan_id: planId,
            payer: {
                name: usuario.nome,
                surname: usuario.sobrenome,
                email: usuario.email,
            },
            back_urls: {
                success: `${process.env.CLIENT_URL}/pagamento-status`,
                failure: `${process.env.CLIENT_URL}/pagamento-status`,
                pending: `${process.env.CLIENT_URL}/pagamento-status`,
            },
            auto_return: 'approved',
            external_reference: req.userId,
        };

        const response = await preference.create({ body: preferenceBody });
        res.json({ preferenceId: response.id });

    } catch (error) {
        console.error("Erro ao criar preferência de assinatura:", error);
        res.status(500).json({ message: "Erro ao criar assinatura." });
    }
});

app.get('/api/verify-payment/:paymentId', autenticar, async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        // Usa a forma moderna de buscar o pagamento
        const payment = await new Payment(client).get({ id: paymentId });

        if (payment && payment.status === 'approved') {
            const userId = payment.external_reference;
            await User.findByIdAndUpdate(userId, { pagamentoEfetuado: true, statusAssinatura: 'ativa' });
            
            console.log(`Pagamento Mercado Pago verificado e confirmado para o usuário: ${userId}`);
            return res.json({ paymentVerified: true });
        }

        return res.json({ paymentVerified: false });
    } catch (error) {
        console.error("Erro ao verificar pagamento no Mercado Pago:", error);
        res.status(500).json({ message: "Erro ao verificar pagamento." });
    }
});

// ✅ NOVIDADE: Rota pública para um usuário se candidatar a afiliado
app.post('/api/affiliate/apply', autenticar, async (req, res) => {
    try {
        const { whatsapp, pixKeyType, pixKey } = req.body;
        if (!whatsapp || !pixKeyType || !pixKey) {
            return res.status(400).json({ message: "Todos os campos do formulário são obrigatórios." });
        }

        const usuario = await User.findById(req.userId);
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });

        if (['affiliate', 'affiliate_pending', 'admin'].includes(usuario.role)) {
            return res.status(400).json({ message: "Você já é um afiliado ou tem uma candidatura em andamento." });
        }

        // Cria o novo perfil de afiliado
        await new AffiliateProfile({ userId: req.userId, whatsapp, pixKeyType, pixKey }).save();
        
        // Atualiza a função do usuário para 'pendente'
        usuario.role = 'affiliate_pending';
        await usuario.save();
        
        res.json({ message: "Candidatura enviada com sucesso! Entraremos em contato assim que for aprovada." });
    } catch (error) {
        console.error("Erro ao processar candidatura de afiliado:", error);
        res.status(500).json({ message: 'Erro ao processar a sua candidatura.' });
    }
});


app.post('/api/validate-and-create-preference', autenticar, async (req, res) => {
    try {
        const { couponCode } = req.body;
        let finalPrice = 79.99;
        let discountApplied = false;

        if (couponCode) {
            // NOVIDADE: Validação real do cupom na API do Mercado Pago
            const response = await axios.get(`https://api.mercadopago.com/v1/discounts/campaigns/search?coupon_code=${couponCode}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
            });

            if (response.data?.results?.length > 0) {
                const campaign = response.data.results[0];
                const discount = (79.99 * campaign.percent_off) / 100;
                finalPrice = 79.99 - discount;
                discountApplied = true;
            } else {
                return res.status(400).json({ message: "Cupom inválido ou não encontrado." });
            }
        }

        const preference = new Preference(client);
        // ... (resto da lógica para criar a preferência com o finalPrice)
        
        res.json({ preferenceId: response.id, finalPrice, discountApplied });

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar preferência de pagamento." });
    }
});

// ✅ ROTA DE PAGAMENTO FINAL: Lida com planos e cupons
app.post('/api/create-payment-preference', autenticar, async (req, res) => {
    try {
        const { planType, couponCode } = req.body; // 'lifetime' ou 'annual'
        
        let title = '';
        let unit_price = 0;

        if (planType === 'lifetime') {
            title = 'BariPlus - Acesso Vitalício';
            unit_price = 79.99;
        } else if (planType === 'annual') {
            title = 'BariPlus - Assinatura Anual';
            unit_price = 49.99; // Exemplo de preço anual
        } else {
            return res.status(400).json({ message: "Tipo de plano inválido." });
        }

        // Lógica de cupom de afiliado
        if (couponCode) {
            const affiliate = await User.findOne({ affiliateCouponCode: couponCode });
            if (affiliate && planType === 'lifetime') { // Desconto só no plano vitalício
                unit_price = 49.99;
            } else if (affiliate && planType === 'annual') {
                unit_price = 29.99; // Exemplo de desconto no anual
            }
        }

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: [{ title, unit_price, quantity: 1, currency_id: 'BRL' }],
                back_urls: {
                    success: `${process.env.CLIENT_URL}/pagamento-status`,
                    failure: `${process.env.CLIENT_URL}/pagamento-status`,
                    pending: `${process.env.CLIENT_URL}/pagamento-status`,
                },
                auto_return: 'approved',
                external_reference: req.userId,
            }
        });

        res.json({ preferenceId: response.id });

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar preferência de pagamento." });
    }
});

// Rota de Admin para buscar apenas os afiliados com candidatura pendente
app.get('/api/admin/pending-affiliates', autenticar, isAdmin, async (req, res) => {
    try {
        // Encontra os perfis de afiliados pendentes e já inclui os dados do usuário associado
        const pendingProfiles = await AffiliateProfile.find({ status: 'pending' })
            .populate({
                path: 'userId',
                select: 'nome sobrenome email username' // Seleciona apenas os campos que queremos mostrar
            });
        
        res.json(pendingProfiles);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar candidaturas pendentes.' });
    }
});

// ✅ NOVIDADE: ROTAS COMPLETAS PARA O MÓDULO DE EXAMES
// Busca todos os dados de exames do usuário
app.get('/api/exams', autenticar, async (req, res) => {
    try {
        const exams = await Exams.findOne({ userId: req.userId });
        if (!exams) {
            // Se por algum motivo não existir, cria um documento vazio
            const newExamsDoc = new Exams({ userId: req.userId, examEntries: [] });
            await newExamsDoc.save();
            return res.json(newExamsDoc);
        }
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar exames." });
    }
});

// Adiciona um novo TIPO de exame à lista do usuário
app.post('/api/exams/type', autenticar, async (req, res) => {
    try {
        const { name, unit } = req.body;
        const exams = await Exams.findOneAndUpdate(
            { userId: req.userId },
            { $push: { examEntries: { name, unit, history: [] } } },
            { new: true, upsert: true }
        );
        res.status(201).json(exams.examEntries[exams.examEntries.length - 1]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar tipo de exame." });
    }
});

// Adiciona um novo RESULTADO a um tipo de exame existente
app.post('/api/exams/result/:examEntryId', autenticar, async (req, res) => {
    try {
        const { examEntryId } = req.params;
        const { date, value, notes } = req.body;

        const exams = await Exams.findOneAndUpdate(
            { "examEntries._id": examEntryId, userId: req.userId },
            { $push: { "examEntries.$.history": { date, value, notes } } },
            { new: true }
        );
        res.status(201).json(exams);
    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar resultado." });
    }
});

// Edita um resultado de exame específico
app.put('/api/exams/result/:examEntryId/:resultId', autenticar, async (req, res) => {
    try {
        const { examEntryId, resultId } = req.params;
        const { date, value, notes } = req.body;

        const exams = await Exams.findOne({ userId: req.userId, "examEntries._id": examEntryId });
        const examEntry = exams.examEntries.id(examEntryId);
        const result = examEntry.history.id(resultId);
        
        result.date = date;
        result.value = value;
        result.notes = notes;
        
        await exams.save();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Erro ao editar resultado." });
    }
});

// Apaga um resultado de exame específico
app.delete('/api/exams/result/:examEntryId/:resultId', autenticar, async (req, res) => {
    try {
        const { examEntryId, resultId } = req.params;
        await Exams.findOneAndUpdate(
            { userId: req.userId, "examEntries._id": examEntryId },
            { $pull: { "examEntries.$.history": { _id: resultId } } }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar resultado." });
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno no servidor' });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Banco de dados: ${process.env.DATABASE_URL}`);
});