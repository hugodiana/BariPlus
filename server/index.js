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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const crypto = require('crypto');

const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
};

const app = express();

// --- CONFIGURAÇÃO DE CORS ---
const whitelist = [
    'https://bariplus.vercel.app',
    'https://bari-plus.vercel.app',
    'https://bariplus-admin.vercel.app',
    'https://bariplus-app.onrender.com',
    'https://bariplus-admin.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://www.bariplus.com' , 
    'https://bariplus.com',  
];

const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // ✅ Adicione esta linha
};

app.use(cors(corsOptions));

// --- ROTA DE WEBHOOK DO STRIPE ---
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const stripeCustomerId = session.customer;
        try {
            const user = await User.findOneAndUpdate({ stripeCustomerId: stripeCustomerId }, { pagamentoEfetuado: true });
            
            // Envia e-mail de confirmação de pagamento
            if (user) {
                await transporter.sendMail({
                    from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
                    to: user.email,
                    subject: "Pagamento Confirmado - BariPlus",
                    html: `<h1>Obrigado, ${user.nome}!</h1><p>O seu pagamento foi processado com sucesso e o seu Acesso Vitalício ao BariPlus está liberado.</p><p>Aproveite todas as funcionalidades!</p>`,
                });
            }
        } catch (err) {
            return res.status(500).json({ error: "Erro ao atualizar status do usuário." });
        }
    }
    
    res.json({received: true});
});

app.use(express.json());

// --- INICIALIZAÇÃO DO FIREBASE ADMIN ---
if (!admin.apps.length) {
    try {
        // Correção: Decodificar a chave privada do Firebase de base64 primeiro
        const firebasePrivateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(firebasePrivateKey);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar Firebase Admin:', error);
        // Adicione este log para verificar a chave
        console.log('Conteúdo de FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY);
    }
}

// --- OUTRAS CONFIGURAÇÕES ---
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// --- CONEXÃO COM O BANCO DE DADOS ---
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error(err));

// --- SCHEMAS E MODELOS ---
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));

// --- SCHEMAS E MODELOS ---
const UserSchema = new mongoose.Schema({ nome: String, sobrenome: String, username: { type: String, unique: true, required: true }, email: { type: String, unique: true, required: true }, password: { type: String, required: true }, onboardingCompleto: { type: Boolean, default: false }, detalhesCirurgia: { fezCirurgia: String, dataCirurgia: Date, altura: Number, pesoInicial: Number, pesoAtual: Number }, stripeCustomerId: String, pagamentoEfetuado: { type: Boolean, default: false }, role: { type: String, enum: ['user', 'admin', 'affiliate'], default: 'user' }, affiliateCouponCode: String, fcmToken: String, notificationSettings: { appointmentReminders: { type: Boolean, default: true }, medicationReminders: { type: Boolean, default: true }, weighInReminders: { type: Boolean, default: true } }, emailVerificationToken: String, emailVerificationExpires: Date, isEmailVerified: { type: Boolean, default: false } }, { timestamps: true });
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const PesoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, registros: [{ peso: Number, data: Date, fotoUrl: String, medidas: { cintura: Number, quadril: Number, braco: Number } }] });
const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Map, default: {} } });
const FoodLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, refeicoes: { cafeDaManha: [mongoose.Schema.Types.Mixed], almoco: [mongoose.Schema.Types.Mixed], jantar: [mongoose.Schema.Types.Mixed], lanches: [mongoose.Schema.Types.Mixed] } });
const GastoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, registros: [{ descricao: { type: String, required: true }, valor: { type: Number, required: true }, data: { type: Date, default: Date.now }, categoria: { type: String, default: 'Outros' } }] });

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const FoodLog = mongoose.model('FoodLog', FoodLogSchema);
const Gasto = mongoose.model('Gasto', GastoSchema);

// --- MIDDLEWARES ---
const autenticar = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.userId = user.userId;
        next();
    });
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
        res.status(500).json({ message: "Erro ao verificar permissões." });
    }
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// --- ROTAS DA API ---
app.post('/api/register', async (req, res) => {
    try {
        const { nome, sobrenome, username, email, password } = req.body;
        if (!validatePassword(password)) {
            return res.status(400).json({ message: "A senha não cumpre os requisitos de segurança." });
        }
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        if (await User.findOne({ username })) return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Gera um código de 6 dígitos aleatório
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // Expira em 15 minutos

        const novoUsuario = new User({ 
            nome, sobrenome, username, email, password: hashedPassword,
            emailVerificationCode: verificationCode,
            emailVerificationExpires: verificationExpires
        });
        await novoUsuario.save();

        // Cria os documentos associados
        await new Checklist({ userId: novoUsuario._id }).save();
        await new Peso({ userId: novoUsuario._id }).save();
        await new Consulta({ userId: novoUsuario._id }).save();
        await new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();
        await new Medication({ userId: novoUsuario._id }).save();
        await new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();
        
        // Envia o e-mail de verificação
        try {
            await transporter.sendMail({
                from: `"BariPlus" <${process.env.SMTP_USER}>`,
                to: novoUsuario.email,
                subject: "Seu Código de Verificação BariPlus",
                html: `<h1>Bem-vindo(a) ao BariPlus!</h1><p>Seu código de verificação é: <strong>${verificationCode}</strong></p><p>Este código expira em 15 minutos.</p>`,
            });
        } catch (emailError) {
            console.error("Falha ao enviar e-mail de verificação:", emailError);
            // Continua o processo mesmo que o e-mail falhe, para não bloquear o usuário
        }
        
        res.status(201).json({ message: 'Usuário pré-cadastrado! Verifique seu e-mail.' });
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
            emailVerificationExpires: { $gt: Date.now() } // Verifica se o token não expirou
        });

        if (!usuario) {
            return res.status(400).json({ message: "Link de verificação inválido ou expirado." });
        }

        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();

        res.json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor." });
    }
});

// Rota de Recuperação de Senha
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'O e-mail é obrigatório.' });
        }

        const usuario = await User.findOne({ email });
        
        // Mesmo se não encontrar, retorna sucesso por segurança
        if (!usuario) {
            return res.json({ 
                message: "Se uma conta com este e-mail existir, um link de redefinição foi enviado." 
            });
        }

        const resetSecret = JWT_SECRET + usuario.password;
        const resetToken = jwt.sign({ userId: usuario._id }, resetSecret, { 
            expiresIn: '15m' 
        });
        
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${usuario._id}/${resetToken}`;
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: usuario.email,
            subject: "Redefinição de Senha - BariPlus",
            html: `
                <p>Olá ${usuario.nome},</p>
                <p>Para redefinir sua senha, clique no link abaixo:</p>
                <a href="${resetLink}">Redefinir Senha</a>
                <p>Este link é válido por 15 minutos.</p>
                <p>Caso não tenha solicitado esta redefinição, ignore este e-mail.</p>
            `,
        });

        res.json({ 
            message: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." 
        });

    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ message: "Erro no servidor." });
    }
});

// Rota de Redefinição de Senha
app.post('/api/reset-password/:userId/:token', async (req, res) => {
    try {
        const { userId, token } = req.params;
        const { password } = req.body;
        
        if (!password || !validatePassword(password)) {
            return res.status(400).json({ 
                message: "A senha não cumpre os requisitos de segurança." 
            });
        }

        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(400).json({ message: "Link inválido ou expirado." });
        }

        const resetSecret = JWT_SECRET + usuario.password;
        jwt.verify(token, resetSecret);

        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        await usuario.save();

        res.json({ message: "Senha redefinida com sucesso!" });

    } catch (error) {
        console.error('Erro na redefinição de senha:', error);
        res.status(400).json({ message: "Link inválido ou expirado." });
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
        const { peso, cintura, quadril, braco } = req.body;
        
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
                cintura: parseFloat(cintura) || null,
                quadril: parseFloat(quadril) || null,
                braco: parseFloat(braco) || null
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

app.post('/api/food-diary/log', autenticar, async (req, res) => {
    try {
        const { date, mealType, food } = req.body;
        
        if (!date || !mealType || !food) {
            return res.status(400).json({ 
                message: 'Data, tipo de refeição e alimento são obrigatórios.' 
            });
        }

        if (!['cafeDaManha', 'almoco', 'jantar', 'lanches'].includes(mealType)) {
            return res.status(400).json({ 
                message: 'Tipo de refeição inválido.' 
            });
        }

        const fieldToUpdate = `refeicoes.${mealType}`;
        const result = await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $push: { [fieldToUpdate]: food } },
            { new: true, upsert: true }
        );

        res.status(201).json(result);
    } catch (error) {
        console.error('Erro ao adicionar alimento:', error);
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

// ROTA DE ADMIN: Promover um usuário a afiliado e criar o seu cupom no Stripe
app.post('/api/admin/promote-to-affiliate/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { couponCode, commissionPercent } = req.body;

        // 1. Cria o cupom no Stripe
        const coupon = await stripe.coupons.create({
            percent_off: commissionPercent,
            duration: 'once',
            name: `Cupom para Afiliado: ${couponCode}`,
        });

        // 2. Cria o código promocional que o cliente vai usar
        const promotionCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: couponCode,
        });

        // 3. Atualiza o usuário no nosso banco de dados
        const usuario = await User.findByIdAndUpdate(userId, {
            $set: {
                role: 'affiliate',
                affiliateCouponCode: promotionCode.code
            }
        }, { new: true }).select('-password');
        
        res.json({ message: "Usuário promovido a afiliado com sucesso!", usuario });

    } catch (error) {
        console.error("Erro ao promover afiliado:", error);
        res.status(500).json({ message: "Erro ao criar cupom ou promover usuário." });
    }
});


// ✅ NOVIDADE: ROTAS DE ADMIN E AFILIADOS
app.post('/api/admin/promote-to-affiliate/:userId', autenticar, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { couponCode } = req.body;
        if (!couponCode) return res.status(400).json({ message: "O código do cupom é obrigatório." });

        // Verifica se o cupom já existe no Stripe para evitar duplicados
        const promotionCodes = await stripe.promotionCodes.list({ code: couponCode });
        if (promotionCodes.data.length > 0) {
            return res.status(400).json({ message: "Este código de cupom já está em uso." });
        }
        
        const coupon = await stripe.coupons.create({ percent_off: 20, duration: 'once', name: `Cupom para Afiliado: ${couponCode}` }); // Ex: 20% de desconto
        const promotionCode = await stripe.promotionCodes.create({ coupon: coupon.id, code: couponCode });

        const usuario = await User.findByIdAndUpdate(userId, {
            $set: { role: 'affiliate', affiliateCouponCode: promotionCode.code }
        }, { new: true }).select('-password');
        
        res.json({ message: "Usuário promovido a afiliado com sucesso!", usuario });
    } catch (error) { res.status(500).json({ message: "Erro ao promover afiliado." }); }
});

app.get('/api/affiliate/stats', autenticar, isAffiliate, async (req, res) => {
    try {
        const affiliateUser = await User.findById(req.userId);
        const couponCode = affiliateUser.affiliateCouponCode;

        if (!couponCode) {
            return res.status(400).json({ message: "Nenhum código de cupom associado a esta conta." });
        }

        // 1. Busca todas as sessões de pagamento bem-sucedidas
        const sessions = await stripe.checkout.sessions.list({
            limit: 100, // Busca as últimas 100 sessões
            expand: ['data.customer', 'data.discounts.promotion_code'], // Garante que temos os dados do cliente e do cupom
        });

        // 2. ✅ CORREÇÃO: Nova lógica de filtro, muito mais robusta
        // Filtra para encontrar as sessões que foram pagas E que usaram o código de cupom do nosso afiliado
        const affiliateSales = sessions.data.filter(session =>
            session.payment_status === 'paid' &&
            session.discounts?.some(d => d.promotion_code?.code.toLowerCase() === couponCode.toLowerCase())
        );

        // 3. Calcula os totais e os detalhes (esta parte continua igual)
        const salesCount = affiliateSales.length;
        const totalRevenueInCents = affiliateSales.reduce((sum, session) => sum + session.amount_total, 0);

        const salesDetails = affiliateSales.map(session => ({
            customerEmail: session.customer?.email || 'Email não disponível',
            amount: (session.amount_total / 100).toFixed(2),
            date: new Date(session.created * 1000).toLocaleDateString('pt-BR')
        }));

        res.json({
            couponCode: couponCode,
            salesCount: salesCount,
            totalRevenueInCents: totalRevenueInCents,
            salesDetails: salesDetails
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas de afiliado:", error);
        res.status(500).json({ message: "Erro ao buscar estatísticas." });
    }
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
        const { year, month } = req.query; // ex: ?year=2025&month=7
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const gastos = await Gasto.find({
            userId: req.userId,
            data: { $gte: startDate, $lte: endDate }
        }).sort({ data: -1 });

        res.json(gastos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar gastos." });
    }
});

app.post('/api/gastos', autenticar, async (req, res) => {
    try {
        const { descricao, valor, categoria, data } = req.body;
        const novoGasto = new Gasto({
            userId: req.userId,
            descricao,
            valor: parseFloat(valor),
            categoria,
            data: data ? new Date(data) : new Date()
        });
        await novoGasto.save();
        res.status(201).json(novoGasto);
    } catch (error) {
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
            emailVerificationExpires: { $gt: Date.now() } // Verifica se o token não expirou
        });

        if (!usuario) {
            return res.status(400).send("Link de verificação inválido ou expirado. Por favor, tente se cadastrar novamente.");
        }

        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();

        // Envia o e-mail de boas-vindas APÓS a verificação
        
        await transporter.sendMail({
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: usuario.email,
            subject: "🎉 Conta Ativada! Bem-vindo(a) ao BariPlus!",
            html: `<h1>Olá, ${usuario.nome}!</h1><p>A sua conta foi ativada com sucesso. Agora você já pode fazer o login e começar a sua jornada.</p>`,
        });
        
        // Redireciona o usuário para uma página de sucesso no front-end
        res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
    } catch (error) {
        res.status(500).send("Erro no servidor ao verificar o e-mail.");
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

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Banco de dados: ${process.env.DATABASE_URL}`);
});