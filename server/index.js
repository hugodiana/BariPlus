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

const app = express();

// --- CONFIGURAÇÃO DE CORS ---
const whitelist = [
    'https://bariplus.vercel.app', 'https://bari-plus.vercel.app',
    'https://bariplus-admin.vercel.app', 'https://bariplus-app.onrender.com',
    'https://bariplus-admin.onrender.com', 'http://localhost:3000',
    'http://localhost:3001', 'http://localhost:3002'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
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
            await User.findOneAndUpdate({ stripeCustomerId: stripeCustomerId }, { pagamentoEfetuado: true });
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
    const encodedKey = process.env.FIREBASE_PRIVATE_KEY;
    const decodedKey = Buffer.from(encodedKey, 'base64').toString('ascii');
    const serviceAccount = JSON.parse(decodedKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

// --- OUTRAS CONFIGURAÇÕES ---
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const storage = multer.memoryStorage();
const upload = multer({ storage });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// --- CONEXÃO COM O BANCO DE DADOS ---
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB!')).catch(err => console.error(err));

// --- SCHEMAS E MODELOS ---
onst UserSchema = new mongoose.Schema({
    // --- Campos do Usuário ---
    nome: { type: String, required: true },
    sobrenome: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    onboardingCompleto: { type: Boolean, default: false },
    detalhesCirurgia: {
        fezCirurgia: String, dataCirurgia: Date, altura: Number,
        pesoInicial: Number, pesoAtual: Number
    },
    stripeCustomerId: String,
    pagamentoEfetuado: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'affiliate'], default: 'user' },
    affiliateCouponCode: String,
    fcmToken: String,
    
    // ✅ CORREÇÃO: O campo 'notificationSettings' fica aqui dentro
    notificationSettings: {
        appointmentReminders: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true }
    }
}, { 
    // ✅ CORREÇÃO: A opção 'timestamps' fica aqui, no segundo objeto
    timestamps: true 
});
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const PesoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, registros: [{ peso: Number, data: Date, fotoUrl: String, medidas: { cintura: Number, quadril: Number, braco: Number } }] });
const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Map, default: {} } });
const FoodLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: String, refeicoes: { cafeDaManha: [mongoose.Schema.Types.Mixed], almoco: [mongoose.Schema.Types.Mixed], jantar: [mongoose.Schema.Types.Mixed], lanches: [mongoose.Schema.Types.Mixed] } });

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const FoodLog = mongoose.model('FoodLog', FoodLogSchema);

// --- MIDDLEWARES ---
const autenticar = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.userId = user.userId;
        next();
    });
};
const isAdmin = async (req, res, next) => {
    const usuario = await User.findById(req.userId);
    if (usuario && usuario.role === 'admin') { next(); } 
    else { res.status(403).json({ message: "Acesso negado." }); }
};
const isAffiliate = async (req, res, next) => {
    const usuario = await User.findById(req.userId);
    if (usuario && usuario.role === 'affiliate') { next(); } 
    else { res.status(403).json({ message: "Acesso negado." }); }
};

// --- ROTAS DA API ---
app.post('/api/register', async (req, res) => {
    try {
        const { nome, sobrenome, username, email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'E-mail já em uso.' });
        if (await User.findOne({ username })) return res.status(400).json({ message: 'Nome de usuário já em uso.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const novoUsuario = new User({ nome, sobrenome, username, email, password: hashedPassword });
        await novoUsuario.save();
        await new Checklist({ userId: novoUsuario._id, preOp: [{ descricao: 'Marcar consulta com cirurgião', concluido: false }], posOp: [{ descricao: 'Tomar suplementos vitamínicos', concluido: false }] }).save();
        await new Peso({ userId: novoUsuario._id, registros: [] }).save();
        await new Consulta({ userId: novoUsuario._id, consultas: [] }).save();
        await new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();
        await new Medication({ userId: novoUsuario._id, medicamentos: [{ nome: 'Vitamina B12', dosagem: '1000mcg', quantidade: 1, unidade: 'comprimido', vezesAoDia: 1 }], historico: {} }).save();
        await new FoodLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0], refeicoes: { cafeDaManha:[], almoco:[], jantar:[], lanches:[] } }).save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!usuario || !(await bcrypt.compare(password, usuario.password))) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ userId: usuario._id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.json({ message: "Se uma conta com este e-mail existir, um link de redefinição foi enviado." });
        }
        const resetSecret = JWT_SECRET + usuario.password;
        const resetToken = jwt.sign({ userId: usuario._id }, resetSecret, { expiresIn: '15m' });
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${usuario._id}/${resetToken}`;
        const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
        await transporter.sendMail({
            from: `"BariPlus" <${process.env.SMTP_USER}>`,
            to: usuario.email,
            subject: "Redefinição de Senha - BariPlus",
            html: `<p>Olá ${usuario.nome},</p><p>Para redefinir sua senha, clique no link abaixo:</p><a href="${resetLink}">Redefinir Senha</a><p>Este link é válido por 15 minutos.</p>`,
        });
        res.json({ message: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." });
    } catch (error) { res.status(500).json({ message: "Erro no servidor." }); }
});

app.post('/api/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;
    const { password } = req.body;
    try {
        const usuario = await User.findById(userId);
        if (!usuario) return res.status(400).json({ message: "Link inválido ou expirado." });
        const resetSecret = JWT_SECRET + usuario.password;
        jwt.verify(token, resetSecret);
        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        await usuario.save();
        res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) { res.status(400).json({ message: "Link inválido ou expirado." }); }
});

app.get('/api/me', autenticar, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId).select('-password');
        res.json(usuario);
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/onboarding', autenticar, async (req, res) => {
    try {
        const { fezCirurgia, dataCirurgia, altura, pesoInicial } = req.body;
        const pesoNum = parseFloat(pesoInicial);
        const detalhes = { fezCirurgia, dataCirurgia: dataCirurgia || null, altura: parseFloat(altura), pesoInicial: pesoNum, pesoAtual: pesoNum };
        await User.findByIdAndUpdate(req.userId, { $set: { detalhesCirurgia: detalhes, onboardingCompleto: true } });
        await Peso.findOneAndUpdate({ userId: req.userId }, { $push: { registros: { peso: pesoNum, data: new Date() } } });
        res.status(200).json({ message: 'Dados salvos com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor ao salvar detalhes.' }); }
});

app.put('/api/user/surgery-date', autenticar, async (req, res) => {
    const { dataCirurgia } = req.body;
    const usuarioAtualizado = await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.dataCirurgia": dataCirurgia } }, { new: true }).select('-password');
    res.json(usuarioAtualizado);
});

app.get('/api/pesos', autenticar, async (req, res) => {
    const pesoDoc = await Peso.findOne({ userId: req.userId });
    res.json(pesoDoc ? pesoDoc.registros : []);
});

app.post('/api/pesos', autenticar, upload.single('foto'), async (req, res) => {
    try {
        const { peso, cintura, quadril, braco } = req.body;
        let fotoUrl = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { resource_type: 'auto', folder: 'bariplus_progress' });
            fotoUrl = result.secure_url;
        }
        const pesoNum = parseFloat(peso);
        const novoRegistro = { peso: pesoNum, data: new Date(), fotoUrl, medidas: { cintura: parseFloat(cintura) || null, quadril: parseFloat(quadril) || null, braco: parseFloat(braco) || null } };
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": pesoNum } });
        const pesoDoc = await Peso.findOneAndUpdate({ userId: req.userId }, { $push: { registros: novoRegistro } }, { new: true, upsert: true });
        res.status(201).json(pesoDoc.registros[pesoDoc.registros.length - 1]);
    } catch (error) { res.status(500).json({ message: 'Erro ao registrar peso.' }); }
});

app.get('/api/checklist', autenticar, async (req, res) => {
    const checklistDoc = await Checklist.findOne({ userId: req.userId });
    res.json(checklistDoc || { preOp: [], posOp: [] });
});

app.post('/api/checklist', autenticar, async (req, res) => {
    const { descricao, type } = req.body;
    const novoItem = { descricao, concluido: false };
    const result = await Checklist.findOneAndUpdate({ userId: req.userId }, { $push: { [type]: novoItem } }, { new: true });
    res.status(201).json(result[type][result[type].length - 1]);
});

app.put('/api/checklist/:itemId', autenticar, async (req, res) => {
    const { itemId } = req.params;
    const { concluido, descricao, type } = req.body;
    try {
        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        if (!checklistDoc) return res.status(404).json({ message: "Checklist não encontrado." });
        const item = checklistDoc[type].id(itemId);
        if (!item) return res.status(404).json({ message: "Item não encontrado." });
        if (descricao !== undefined) item.descricao = descricao;
        if (concluido !== undefined) item.concluido = concluido;
        await checklistDoc.save();
        res.json(item);
    } catch (error) { res.status(500).json({ message: "Erro ao atualizar item." }); }
});

app.delete('/api/checklist/:itemId', autenticar, async (req, res) => {
    const { itemId } = req.params;
    const { type } = req.query;
    try {
        await Checklist.findOneAndUpdate({ userId: req.userId }, { $pull: { [type]: { _id: itemId } } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Erro ao apagar item." }); }
});

app.get('/api/consultas', autenticar, async (req, res) => {
    const consultaDoc = await Consulta.findOne({ userId: req.userId });
    res.json(consultaDoc ? consultaDoc.consultas : []);
});

app.post('/api/consultas', autenticar, async (req, res) => {
    const { especialidade, data, local, notas } = req.body;
    const novaConsulta = { especialidade, data, local, notas, status: 'Agendado' };
    const result = await Consulta.findOneAndUpdate({ userId: req.userId }, { $push: { consultas: novaConsulta } }, { new: true });
    res.status(201).json(result.consultas[result.consultas.length - 1]);
});

app.put('/api/consultas/:consultaId', autenticar, async (req, res) => {
    try {
        const { consultaId } = req.params;
        const { especialidade, data, local, notas } = req.body;
        const consultaDoc = await Consulta.findOne({ "consultas._id": consultaId, userId: req.userId });
        if (!consultaDoc) return res.status(404).json({ message: "Consulta não encontrada." });
        const itemDaConsulta = consultaDoc.consultas.id(consultaId);
        itemDaConsulta.especialidade = especialidade; itemDaConsulta.data = data; itemDaConsulta.local = local; itemDaConsulta.notas = notas;
        await consultaDoc.save();
        res.json(itemDaConsulta);
    } catch (error) { res.status(500).json({ message: "Erro no servidor ao editar consulta." }); }
});

app.delete('/api/consultas/:consultaId', autenticar, async (req, res) => {
    const { consultaId } = req.params;
    await Consulta.findOneAndUpdate({ userId: req.userId }, { $pull: { consultas: { _id: consultaId } } });
    res.status(204).send();
});

app.get('/api/dailylog/today', autenticar, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let log = await DailyLog.findOne({ userId: req.userId, date: today });
        if (!log) {
            log = new DailyLog({ userId: req.userId, date: today });
            await log.save();
        }
        res.json(log);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar log diário." }); }
});

app.post('/api/dailylog/track', autenticar, async (req, res) => {
    try {
        const { type, amount } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const fieldToUpdate = type === 'water' ? 'waterConsumed' : 'proteinConsumed';
        const updatedLog = await DailyLog.findOneAndUpdate({ userId: req.userId, date: today }, { $inc: { [fieldToUpdate]: amount } }, { new: true, upsert: true });
        res.json(updatedLog);
    } catch (error) { res.status(500).json({ message: "Erro ao registrar consumo." }); }
});

app.get('/api/medication', autenticar, async (req, res) => {
    let doc = await Medication.findOne({ userId: req.userId });
    if (!doc) {
        doc = new Medication({ userId: req.userId, medicamentos: [], historico: {} });
        await doc.save();
    }
    res.json(doc);
});

app.post('/api/medication', autenticar, async (req, res) => {
    const { nome, dosagem, quantidade, unidade, vezesAoDia } = req.body;
    const novoMedicamento = { nome, dosagem, quantidade, unidade, vezesAoDia };
    const result = await Medication.findOneAndUpdate({ userId: req.userId }, { $push: { medicamentos: novoMedicamento } }, { new: true, upsert: true });
    res.status(201).json(result.medicamentos[result.medicamentos.length - 1]);
});

app.post('/api/medication/log/update', autenticar, async (req, res) => {
    const { date, medId, count } = req.body;
    const fieldToUpdate = `historico.${date}.${medId}`;
    const updatedDoc = await Medication.findOneAndUpdate({ userId: req.userId }, { $set: { [fieldToUpdate]: count } }, { new: true, upsert: true });
    res.json(updatedDoc.historico.get(date) || {});
});

app.delete('/api/medication/:medId', autenticar, async (req, res) => {
    const { medId } = req.params;
    await Medication.findOneAndUpdate({ userId: req.userId }, { $pull: { medicamentos: { _id: medId } } });
    res.status(204).send();
});

app.get('/api/diario/:date', autenticar, async (req, res) => {
    try {
        const { date } = req.params;
        let diario = await DiarioAlimentar.findOne({ userId: req.userId, date: date });
        if (!diario) {
            diario = new DiarioAlimentar({ userId: req.userId, date: date });
            await diario.save();
        }
        res.json(diario);
    } catch (error) { res.status(500).json({ message: "Erro ao buscar diário alimentar." }); }
});

app.post('/api/diario', autenticar, async (req, res) => {
    try {
        const { date, tipoRefeicao, alimentos } = req.body;
        if (!date || !tipoRefeicao || !alimentos || !Array.isArray(alimentos)) return res.status(400).json({ message: "Dados incompletos." });
        const campoParaAtualizar = `refeicoes.${tipoRefeicao}`;
        const diario = await DiarioAlimentar.findOneAndUpdate({ userId: req.userId, date: date }, { $push: { [campoParaAtualizar]: { $each: alimentos } } }, { new: true, upsert: true });
        res.status(201).json(diario);
    } catch (error) { res.status(500).json({ message: "Erro ao adicionar alimento." }); }
});

app.delete('/api/diario/:date/:tipoRefeicao/:alimentoId', autenticar, async (req, res) => {
    try {
        const { date, tipoRefeicao, alimentoId } = req.params;
        const campoParaAtualizar = `refeicoes.${tipoRefeicao}`;
        await DiarioAlimentar.findOneAndUpdate({ userId: req.userId, date: date }, { $pull: { [campoParaAtualizar]: { _id: alimentoId } } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Erro ao apagar alimento." }); }
});

// --- ROTA DO STRIPE ---
app.post('/api/create-checkout-session', autenticar, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId);
        let stripeCustomerId = usuario.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: usuario.email,
                name: `${usuario.nome} ${usuario.sobrenome}`
            });
            stripeCustomerId = customer.id;
            await User.findByIdAndUpdate(req.userId, { stripeCustomerId: stripeCustomerId });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            mode: 'payment',
            customer: stripeCustomerId,
            allow_promotion_codes: true,
            line_items: [{
                // ✅ Esta linha precisa da variável de ambiente para funcionar
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            }],
            success_url: `${process.env.CLIENT_URL}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/planos`,
            
        });

        res.json({ id: session.id }); // Enviando o ID da sessão para o front-end

    } catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        res.status(500).json({ error: { message: error.message } });
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
app.get('/api/foods/search', autenticar, async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "É necessário um termo de busca." });
    }
    const searchUrl = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    try {
        const response = await axios.get(searchUrl);
        const products = (response.data.products || []).map(food => ({
            id: food.id,
            name: food.product_name_pt || food.product_name || 'Nome não disponível',
            brand: food.brands || 'Marca não informada',
            imageUrl: food.image_front_small_url || food.image_front_url || null,
            nutrients: {
                calories: food.nutriments.energy_kcal_100g || 'N/A',
                proteins: food.nutriments.proteins_100g || 'N/A',
                carbs: food.nutriments.carbohydrates_100g || 'N/A',
                fats: food.nutriments.fat_100g || 'N/A'
            }
        }));
        res.json(products);
    } catch (error) {
        console.error("Erro ao buscar na Open Food Facts:", error);
        res.status(500).json({ message: "Erro ao buscar alimentos." });
    }
});

// Adicionar um alimento a uma refeição
app.post('/api/food-diary/log', autenticar, async (req, res) => {
    try {
        const { date, mealType, food } = req.body; // mealType será 'cafeDaManha', 'almoco', etc.
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

// Apagar um alimento de uma refeição
app.delete('/api/food-diary/log/:date/:mealType/:itemId', autenticar, async (req, res) => {
    try {
        const { date, mealType, itemId } = req.params;
        const fieldToUpdate = `refeicoes.${mealType}`;
        await FoodLog.findOneAndUpdate(
            { userId: req.userId, date: date },
            { $pull: { [fieldToUpdate]: { _id: itemId } } }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar alimento." });
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

app.listen(PORT, () => console.log(`Servidor do BariPlus rodando na porta ${PORT}`));