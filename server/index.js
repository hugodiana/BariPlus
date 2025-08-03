require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const admin = require('firebase-admin');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');

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

// Webhook precisa vir antes do express.json() se usar `express.raw`
app.post('/api/kiwify-webhook', express.json(), async (req, res) => {
    try {
        const kiwifyEvent = req.body;

        if (kiwifyEvent.order_status === 'paid' || kiwifyEvent.subscription_status === 'active') {
            const customer = kiwifyEvent.Customer;
            if (!customer) {
                console.error("Webhook da Kiwify recebido sem dados do cliente.");
                return res.sendStatus(400); // Bad Request
            }

            const userEmail = customer.email.toLowerCase();
            const userName = customer.full_name;

            let usuario = await User.findOne({ email: userEmail });

            if (usuario) {
                usuario.pagamentoEfetuado = true;
                usuario.kiwifySubscriptionId = kiwifyEvent.subscription_id || kiwifyEvent.order_id;
                await usuario.save();
                console.log(`Acesso atualizado para o usuário existente: ${userEmail}`);
            } else {
                const tempPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                const novoUsuario = new User({
                    nome: userName,
                    email: userEmail,
                    password: hashedPassword,
                    pagamentoEfetuado: true,
                    kiwifySubscriptionId: kiwifyEvent.subscription_id || kiwifyEvent.order_id,
                });
                await novoUsuario.save();

                await Promise.all([
                    new Checklist({ userId: novoUsuario._id }).save(),
                    new Peso({ userId: novoUsuario._id }).save(),
                    new Consulta({ userId: novoUsuario._id }).save(),
                    new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                    new Medication({ userId: novoUsuario._id }).save(),
                    new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
                    new Gasto({ userId: novoUsuario._id, registros: [] }).save(),
                    new Exams({ userId: novoUsuario._id }).save()
                ]);

                const resetToken = crypto.randomBytes(32).toString('hex');
                novoUsuario.resetPasswordToken = resetToken;
                novoUsuario.resetPasswordExpires = Date.now() + 24 * 3600000; // 24 horas
                await novoUsuario.save();

                const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                
                await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [userEmail],
                    subject: 'Bem-vindo(a) ao BariPlus! Configure o seu acesso.',
                    html: `<h1>Compra Aprovada!</h1><p>Olá, ${userName}!</p><p>O seu acesso ao BariPlus foi liberado. Clique no link abaixo para criar a sua senha de acesso:</p><a href="${setupPasswordLink}">Criar Minha Senha</a>`,
                });
                console.log(`Novo usuário criado e e-mail de boas-vindas enviado para: ${userEmail}`);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Erro no webhook da Kiwify:', error);
        res.sendStatus(500);
    }
});


app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/login', limiter);
app.use('/api/forgot-password', limiter);

// --- 2. CONFIGURAÇÕES DE SERVIÇOS ---
const resend = new Resend(process.env.RESEND_API_KEY);

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
const storage = multer.memoryStorage();
const upload = multer({ storage });

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));

// --- 3. SCHEMAS E MODELOS ---
const UserSchema = new mongoose.Schema({ nome: String, sobrenome: String, whatsapp: String, username: { type: String, unique: true, required: true }, email: { type: String, unique: true, required: true }, password: { type: String, required: true }, isEmailVerified: { type: Boolean, default: false }, emailVerificationToken: String, emailVerificationExpires: Date, resetPasswordToken: String, resetPasswordExpires: Date, onboardingCompleto: { type: Boolean, default: false }, detalhesCirurgia: { fezCirurgia: String, dataCirurgia: Date, altura: Number, pesoInicial: Number, pesoAtual: Number }, pagamentoEfetuado: { type: Boolean, default: false }, role: { type: String, enum: ['user', 'admin', 'affiliate', 'affiliate_pending'], default: 'user' }, affiliateCouponCode: String, fcmToken: String, notificationSettings: { appointmentReminders: { type: Boolean, default: true }, medicationReminders: { type: Boolean, default: true }, weighInReminders: { type: Boolean, default: true } }, mercadoPagoUserId: String, affiliateProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateProfile' } }, { timestamps: true });
const AffiliateProfileSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, whatsapp: String, pixKeyType: { type: String, enum: ['CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória', 'Celular'], required: true }, pixKey: { type: String, required: true }, couponCode: { type: String }, status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, payoutHistory: [{ date: { type: Date, default: Date.now }, amountInCents: { type: Number, required: true, min: 0 }, receiptUrl: String, }] }, { timestamps: true });
const PesoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, registros: [{ peso: Number, data: Date, fotoUrl: String, medidas: { pescoco: Number, torax: Number, cintura: Number, abdomen: Number, quadril: Number, bracoDireito: Number, bracoEsquerdo: Number, antebracoDireito: Number, antebracoEsquerdo: Number, coxaDireita: Number, coxaEsquerda: Number, panturrilhaDireita: Number, panturrilhaEsquerda: Number } }] }, { timestamps: true });
const GastoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, registros: [{ descricao: { type: String, required: true }, valor: { type: Number, required: true }, data: { type: Date, default: Date.now }, categoria: { type: String, default: 'Outros' } }] });
const ExamsSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, examEntries: [{ name: { type: String, required: true }, unit: { type: String, required: true }, history: [{ date: { type: Date, required: true }, value: { type: Number, required: true }, notes: String }] }] }, { timestamps: true });
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Map, default: {} } });
const FoodLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, date: String, refeicoes: { cafeDaManha: [mongoose.Schema.Types.Mixed], almoco: [mongoose.Schema.Types.Mixed], jantar: [mongoose.Schema.Types.Mixed], lanches: [mongoose.Schema.Types.Mixed] } });
const AfiliadoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    codigo: { type: String, required: true, unique: true, uppercase: true },
    descontoPercentual: { type: Number, required: true, default: 30 },
    comissaoPercentual: { type: Number, required: true, default: 30 },
}, { timestamps: true });

const VendaSchema = new mongoose.Schema({
    afiliadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Afiliado', required: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: String, required: true },
    valorPagoEmCentavos: { type: Number, required: true },
    comissaoEmCentavos: { type: Number, required: true },
}, { timestamps: true });


const User = mongoose.model('User', UserSchema);
const AffiliateProfile = mongoose.model('AffiliateProfile', AffiliateProfileSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Gasto = mongoose.model('Gasto', GastoSchema);
const Exams = mongoose.model('Exams', ExamsSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const FoodLog = mongoose.model('FoodLog', FoodLogSchema);
const Afiliado = mongoose.model('Afiliado', AfiliadoSchema);
const Venda = mongoose.model('Venda', VendaSchema);

// --- 4. FUNÇÕES AUXILIARES E MIDDLEWARES ---
const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>*]/.test(password)) return false;
    return true;
};

const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
            res.status(403).json({ message: "Acesso negado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar permissões." });
    }
};

const isAffiliate = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.userId);
        if (usuario && usuario.role === 'affiliate') {
            next();
        } else {
            res.status(403).json({ message: "Acesso negado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar permissões de afiliado." });
    }
};

// --- 5. ROTAS DA API ---
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'BariPlus API is running!' });
});

app.post('/api/kiwify-webhook', async (req, res) => {
    try {
        const kiwifyEvent = req.body;
        const customer = kiwifyEvent.Customer;
        const userEmail = customer?.email?.toLowerCase();
        const userName = customer?.full_name;

        if (!userEmail || !userName) {
            return res.status(400).send('Dados do cliente em falta.');
        }

        let usuario = await User.findOne({ email: userEmail });

        // --- LÓGICA PARA PAGAMENTO APROVADO ---
        if (kiwifyEvent.order_status === 'paid') {
            if (usuario) {
                usuario.pagamentoEfetuado = true;
                await usuario.save();
                console.log(`Acesso atualizado para o usuário existente: ${userEmail}`);
            } else {
                // Cria novo usuário se não existir
                const tempPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                const resetToken = crypto.randomBytes(32).toString('hex');

                usuario = new User({
                    nome: userName, email: userEmail, password: hashedPassword,
                    pagamentoEfetuado: true,
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: Date.now() + 24 * 3600000, // 24 horas
                });
                await usuario.save();
                // Lembre-se de criar os outros documentos aqui (new Peso, new Checklist, etc.)

                // Envia e-mail de boas-vindas com tratamento de erro
                console.log(`Tentando enviar e-mail de boas-vindas para ${userEmail}...`);
                const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
                const { data, error } = await resend.emails.send({
                    from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: [userEmail],
                    subject: 'Bem-vindo(a) ao BariPlus! Configure o seu acesso.',
                    html: `<h1>Compra Aprovada!</h1><p>Olá, ${userName}!</p><p>O seu acesso ao BariPlus foi liberado. Clique no link abaixo para criar a sua senha de acesso:</p><a href="${setupPasswordLink}">Criar Minha Senha</a>`,
                });

                if (error) {
                    console.error("ERRO DETALHADO DO RESEND:", error);
                } else {
                    console.log("E-mail de boas-vindas enviado com sucesso!", data.id);
                }
            }
        }
        
        // ✅ NOVIDADE: LÓGICA PARA REEMBOLSO OU ESTORNO
        else if (kiwifyEvent.order_status === 'refunded' || kiwifyEvent.order_status === 'chargebacked') {
            if (usuario) {
                usuario.pagamentoEfetuado = false;
                await usuario.save();
                console.log(`Acesso removido para o usuário ${userEmail} devido a ${kiwifyEvent.order_status}.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Erro no webhook da Kiwify:', error);
        res.sendStatus(500);
    }
});


app.post('/api/register', async (req, res) => {
    let novoUsuario;
    try {
        const { nome, sobrenome, username, email, password, whatsapp } = req.body;
        if (!validatePassword(password)) return res.status(400).json({ message: "A senha não cumpre os requisitos de segurança." });
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        novoUsuario = new User({
            nome, sobrenome, username, email, whatsapp, password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 3600000), // 1 hora
        });
        await novoUsuario.save();
        
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        
        const { data, error } = await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [novoUsuario.email],
            subject: 'Ative a sua Conta no BariPlus',
            html: `<h1>Bem-vindo(a)!</h1><p>Clique no link para ativar sua conta:</p><a href="${verificationLink}">Ativar Conta</a>`,
        });
        
        if (error) {
            console.error("Erro detalhado do Resend:", error);
            await User.findByIdAndDelete(novoUsuario._id);
            return res.status(500).json({ message: 'Falha ao enviar e-mail de verificação.' });
        }
        
        await Promise.all([
            new Checklist({ userId: novoUsuario._id }).save(),
            new Peso({ userId: novoUsuario._id }).save(),
            new Consulta({ userId: novoUsuario._id }).save(),
            new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
            new Medication({ userId: novoUsuario._id }).save(),
            new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save(),
            new Gasto({ userId: novoUsuario._id, registros: [] }).save(),
            new Exams({ userId: novoUsuario._id }).save()
        ]);
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso! Verifique seu e-mail.' });
    } catch (error) {
        console.error("Erro no registro:", error);
        if (novoUsuario?._id) await User.findByIdAndDelete(novoUsuario._id);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

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
            emailVerificationExpires: { $gt: new Date() }
        });

        // Se o token for inválido ou expirado, retorna um erro
        if (!usuario) {
            return res.status(400).json({ message: "Link de verificação inválido ou expirado." });
        }
        
        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();
        
        // Retorna uma mensagem de sucesso
        res.status(200).json({ message: "E-mail verificado com sucesso!" });

    } catch (error) { 
        console.error("Erro na verificação de e-mail:", error);
        res.status(500).json({ message: "Erro no servidor ao verificar o e-mail." });
    }
});


// Rota de Recuperação de Senha
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await User.findOne({ email });
        
        if (usuario) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            usuario.resetPasswordToken = resetToken;
            usuario.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
            await usuario.save();
            
            const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        
        // ✅ NOVIDADE: Bloco try...catch específico para o envio de e-mail
        try {
            await resend.emails.send({
                from: `BariPlus <contato@bariplus.com.br>`,
                to: [usuario.email],
                subject: "Redefinição de Senha - BariPlus",
                html: `<p>Para redefinir sua senha, clique no link:</p><a href="${resetLink}">Redefinir Senha</a>`,
            });
        } catch (emailError) {
            console.error("Falha ao enviar e-mail de recuperação:", emailError);
            // Não retornamos um erro para o usuário por segurança, mas logamos o erro no servidor
        }
    }
        
        res.json({ message: "Se uma conta com este e-mail existir, um link de redefinição foi enviado." });
    }   catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.post('/api/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!validatePassword(password)) {
            return res.status(400).json({ message: "A nova senha não cumpre os requisitos de segurança." });
        }

        const usuario = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!usuario) {
            return res.status(400).json({ message: "Token inválido ou expirado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();

        res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
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
})

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
        const { peso, cintura, quadril, pescoco, torax, abdomen, bracoDireito, bracoEsquerdo, antebracoDireito, antebracoEsquerdo, coxaDireita, coxaEsquerda, panturrilhaDireita, panturrilhaEsquerda } = req.body;
        let fotoUrl = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "bariplus_progress" });
            fotoUrl = result.secure_url;
        }
        const pesoNum = parseFloat(peso);
        const novoRegistro = {
            peso: pesoNum, data: new Date(), fotoUrl,
            medidas: {
                pescoco: parseFloat(pescoco) || null, torax: parseFloat(torax) || null, cintura: parseFloat(cintura) || null,
                abdomen: parseFloat(abdomen) || null, quadril: parseFloat(quadril) || null, bracoDireito: parseFloat(bracoDireito) || null,
                bracoEsquerdo: parseFloat(bracoEsquerdo) || null, antebracoDireito: parseFloat(antebracoDireito) || null,
                antebracoEsquerdo: parseFloat(antebracoEsquerdo) || null, coxaDireita: parseFloat(coxaDireita) || null,
                coxaEsquerda: parseFloat(coxaEsquerda) || null, panturrilhaDireita: parseFloat(panturrilhaDireita) || null,
                panturrilhaEsquerda: parseFloat(panturrilhaEsquerda) || null
            }
        };
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": pesoNum } });
        const pesoDoc = await Peso.findOneAndUpdate({ userId: req.userId }, { $push: { registros: novoRegistro } }, { new: true, upsert: true });
        res.status(201).json(pesoDoc.registros[pesoDoc.registros.length - 1]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar peso.' });
    }
});

app.put('/api/pesos/:registroId', autenticar, upload.single('foto'), async (req, res) => {
    try {
        const { registroId } = req.params;
        const updates = req.body;
        const pesoDoc = await Peso.findOne({ userId: req.userId });
        if (!pesoDoc) return res.status(404).json({ message: "Histórico de peso não encontrado." });
        const registro = pesoDoc.registros.id(registroId);
        if (!registro) return res.status(404).json({ message: "Registro não encontrado." });

        // Atualiza os campos dinamicamente
        Object.keys(updates).forEach(key => {
            if (key === 'peso') {
                registro[key] = parseFloat(updates[key]);
            } else if (registro.medidas && key in registro.medidas) {
                registro.medidas[key] = parseFloat(updates[key]) || null;
            }
        });
        
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "bariplus_progress" });
            registro.fotoUrl = result.secure_url;
        }
        
        pesoDoc.markModified('registros');
        await pesoDoc.save();
        
        const ultimoRegistro = pesoDoc.registros.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": ultimoRegistro.peso } });

        res.json(registro);
    } catch (error) {
        console.error("Erro ao atualizar registro:", error);
        res.status(500).json({ message: 'Erro ao atualizar registro.' });
    }
});


app.delete('/api/pesos/:registroId', autenticar, async (req, res) => {
    try {
        const { registroId } = req.params;

        const pesoDoc = await Peso.findOne({ userId: req.userId });
        if (!pesoDoc) return res.status(404).json({ message: "Nenhum registro encontrado." });
        
        // Remove o subdocumento do array
        pesoDoc.registros.pull({ _id: registroId });
        await pesoDoc.save();
        
        // Recalcula o peso atual do usuário
        if (pesoDoc.registros.length > 0) {
            const ultimoRegistro = pesoDoc.registros.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
            await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": ultimoRegistro.peso } });
        } else {
            const usuario = await User.findById(req.userId);
            if (usuario) {
                await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": usuario.detalhesCirurgia.pesoInicial } });
            }
        }

        res.status(204).send();
    } catch (error) {
        console.error("Erro ao apagar registro:", error);
        res.status(500).json({ message: 'Erro ao apagar registro.' });
    }
});

app.get('/api/pesos', autenticar, async (req, res) => {
    try {
        const pesoDoc = await Peso.findOne({ userId: req.userId });
        res.json(pesoDoc ? pesoDoc.registros : []);
    } catch (error) {
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

app.post('/api/admin/afiliados', autenticar, isAdmin, async (req, res) => {
    try {
        const { nome, email, codigo } = req.body;
        const novoAfiliado = new Afiliado({ nome, email, codigo });
        await novoAfiliado.save();
        res.status(201).json(novoAfiliado);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar afiliado.', error });
    }
});


app.get('/api/admin/afiliados', autenticar, isAdmin, async (req, res) => {
    try {
        const afiliados = await Afiliado.find();
        res.json(afiliados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar afiliados.' });
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
            await resend.emails.send({
                from: `"BariPlus" <'contato@bariplus.com.br'>`,
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
            emailVerificationExpires: { $gt: new Date() }
        });
        if (!usuario) {
            // Redireciona para uma página de erro no front-end
            return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_token`);
        }
        
        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();
        
        // Redireciona para a página de login com uma mensagem de sucesso
        res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
    } catch (error) { 
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
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
        usuario.emailVerificationToken = verificationToken;
        usuario.emailVerificationExpires = new Date(Date.now() + 3600000); // Expira em 1 hora
        await usuario.save();
        
        // Reenvia o e-mail
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await resend.emails.send({
            from: `"BariPlus" <contato@bariplus.com.br>`,
            to: usuario.email,
            subject: "Seu Novo Link de Verificação BariPlus",
            html: `<h1>Novo Link de Ativação</h1><p>Aqui está o seu novo link para ativar a sua conta:</p><a href="${verificationLink}">Ativar Minha Conta</a>`,
        });

        res.json({ message: "Um novo link de verificação foi enviado para o seu e-mail." });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});

app.post('/api/process-payment', autenticar, async (req, res) => {
    try {
        const { token, payment_method_id, installments, payer, afiliadoCode } = req.body;
        const PRECO_BASE = 109.99;
        let precoFinal = PRECO_BASE;
        let afiliado = null;

        if (afiliadoCode) {
            afiliado = await Afiliado.findOne({ codigo: afiliadoCode.toUpperCase() }); // Corrigido
            if (afiliado) {
                precoFinal = PRECO_BASE * 0.70; // Aplica 30% de desconto
            }
        }

        const payment = new Payment(client);
        const paymentResponse = await payment.create({
            body: {
                transaction_amount: Number(precoFinal.toFixed(2)),
                token,
                description: 'BariPlus - Acesso Vitalício',
                installments,
                payment_method_id,
                payer: { email: payer.email },
                external_reference: req.userId,
            }
        });

        if (paymentResponse.status === 'approved') {
            await User.findByIdAndUpdate(req.userId, { pagamentoEfetuado: true });

            if (afiliado) {
                const valorPagoEmCentavos = Math.round(precoFinal * 100);
                const comissaoEmCentavos = Math.round(valorPagoEmCentavos * (afiliado.comissaoPercentual / 100)); // Corrigido
                await new Venda({
                    afiliadoId: afiliado._id,
                    clienteId: req.userId,
                    paymentId: paymentResponse.id,
                    valorPagoEmCentavos,
                    comissaoEmCentavos,
                }).save();
            }
        }
        res.status(201).json({ status: paymentResponse.status, message: paymentResponse.status_detail });

    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
        const errorMessage = error.cause?.message || "Erro desconhecido.";
        res.status(500).json({ message: errorMessage });
    }
});

app.post('/api/validate-coupon', autenticar, async (req, res) => {
    try {
        const { afiliadoCode } = req.body;
        if (!afiliadoCode) {
            return res.status(400).json({ message: "Código de afiliado não fornecido." });
        }
        const afiliado = await Afiliado.findOne({ codigo: afiliadoCode.toUpperCase() }); // Corrigido
        if (afiliado) {
            res.json({ valid: true, message: "Cupom válido!" });
        } else {
            res.status(404).json({ valid: false, message: "Cupom de afiliado inválido ou não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor ao validar o cupom." });
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

app.post('/api/create-preference', autenticar, async (req, res) => {
    try {
        const { afiliadoCode } = req.body;
        const PRECO_BASE = 109.99;
        let precoFinal = PRECO_BASE;
        const metadata = {};

        if (afiliadoCode) {
            // A validação do cupom acontece aqui no back-end
            const afiliado = await User.findOne({ affiliateCode: afiliadoCode.toUpperCase(), role: 'affiliate' });
            if (afiliado) {
                precoFinal = PRECO_BASE * 0.70;
                metadata.afiliado_id = afiliado._id.toString();
            }
        }
        
        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: [{
                    title: 'BariPlus - Acesso Vitalício',
                    unit_price: Number(precoFinal.toFixed(2)),
                    quantity: 1,
                    currency_id: 'BRL',
                }],
                metadata: metadata,
                external_reference: req.userId,
                back_urls: { success: `${process.env.CLIENT_URL}/pagamento-status` },
                auto_return: 'approved',
            }
        });
        res.json({ preferenceId: response.id, finalPrice: precoFinal });
    } catch (error) {
        console.error("Erro ao criar preferência:", error);
        res.status(500).json({ message: "Erro ao criar preferência de pagamento." });
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

app.post('/api/create-payment-preference', autenticar, async (req, res) => {
    try {
        const { afiliadoCode } = req.body;
        const PRECO_BASE = 109.99;
        let precoFinal = PRECO_BASE;
        const metadata = {};

        if (afiliadoCode) {
            const afiliado = await Afiliado.findOne({ codigo: afiliadoCode.toUpperCase() });
            if (afiliado) {
                precoFinal = PRECO_BASE * (1 - (afiliado.descontoPercentual / 100));
                metadata.afiliado_id = afiliado._id.toString();
            } else {
                return res.status(400).json({ message: "Cupom de afiliado inválido." });
            }
        }
        
        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: [{
                    title: 'BariPlus - Acesso Vitalício',
                    unit_price: Number(precoFinal.toFixed(2)),
                    quantity: 1,
                    currency_id: 'BRL',
                }],
                metadata: metadata,
                external_reference: req.userId,
                back_urls: { success: `${process.env.CLIENT_URL}/pagamento-status` },
                auto_return: 'approved',
            }
        });
        res.json({ preferenceId: response.id, finalPrice: precoFinal });
    } catch (error) {
        console.error("Erro ao criar preferência:", error);
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

// --- TRATAMENTO DE ERROS E INICIALIZAÇÃO DO SERVIDOR ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno no servidor' });
});

// Conecta ao MongoDB antes de iniciar o servidor
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