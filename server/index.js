require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÕES ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Falha na conexão:', err));

// --- SCHEMAS E MODELOS ---
const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sobrenome: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    onboardingCompleto: { type: Boolean, default: false },
    detalhesCirurgia: {
        fezCirurgia: String, dataCirurgia: Date, altura: Number,
        pesoInicial: Number, pesoAtual: Number
    }
});

const ChecklistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preOp: [{ descricao: String, concluido: Boolean }],
    posOp: [{ descricao: String, concluido: Boolean }]
});

const PesoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registros: [{
        peso: Number,
        data: Date,
        fotoUrl: String,
        medidas: { cintura: Number, anca: Number, braco: Number }
    }]
});

const ConsultaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }]
});

const DailyLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    waterConsumed: { type: Number, default: 0 },
    proteinConsumed: { type: Number, default: 0 }
});

const MedicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicamentos: [{
        nome: String, dosagem: String, quantidade: Number,
        unidade: String, vezesAoDia: Number,
    }],
    historico: { type: Map, of: Number, default: {} }
});

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);


// --- MIDDLEWARE DE AUTENTICAÇÃO ---
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

// --- ROTAS DA API ---
app.post('/api/register', async (req, res) => {
    try {
        const { nome, sobrenome, username, email, password } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        if (await User.findOne({ username })) return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const novoUsuario = new User({ nome, sobrenome, username, email, password: hashedPassword });
        await novoUsuario.save();

        await new Checklist({ userId: novoUsuario._id, preOp: [{ descricao: 'Marcar consulta com cirurgião', concluido: false }], posOp: [{ descricao: 'Tomar suplementos vitamínicos', concluido: false }] }).save();
        await new Peso({ userId: novoUsuario._id, registros: [] }).save();
        await new Consulta({ userId: novoUsuario._id, consultas: [] }).save();
        await new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();
        await new Medication({ userId: novoUsuario._id, medicamentos: [{ nome: 'Vitamina B12', dosagem: '1000mcg', quantidade: 1, unidade: 'comprimido', vezesAoDia: 1 }], historico: {} }).save();
        
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

// Rota de Pesos atualizada para aceitar foto e medidas
app.post('/api/pesos', autenticar, upload.single('foto'), async (req, res) => {
    try {
        const { peso, cintura, anca, braco } = req.body;
        let fotoUrl = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { resource_type: 'auto', folder: 'bariplus_progress' });
            fotoUrl = result.secure_url;
        }
        const pesoNum = parseFloat(peso);
        const novoRegistro = {
            peso: pesoNum, data: new Date(), fotoUrl,
            medidas: { cintura: parseFloat(cintura) || null, anca: parseFloat(anca) || null, braco: parseFloat(braco) || null }
        };
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": pesoNum } });
        const pesoDoc = await Peso.findOneAndUpdate({ userId: req.userId }, { $push: { registros: novoRegistro } }, { new: true, upsert: true });
        res.status(201).json(pesoDoc.registros[pesoDoc.registros.length - 1]);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Erro ao registrar peso.' }); }
});

// Rotas de Checklist, Consultas, DailyLog e Medication ...
// (Cole aqui as outras rotas completas que já funcionavam)

app.listen(PORT, () => console.log(`Servidor do BariPlus rodando na porta ${PORT}`));