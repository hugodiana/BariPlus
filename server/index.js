require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const nodemailer = require('nodemailer');

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
        medidas: { cintura: Number, quadril: Number, braco: Number }
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
        nome: String,
        dosagem: String,
        quantidade: Number,
        unidade: String,
        vezesAoDia: Number,
    }],
    historico: {
        type: Map,
        of: Number,
        default: {}
    }
});

const AlimentoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    quantidade: { type: String, required: true },
    calorias: { type: Number, default: 0 },
    proteinas: { type: Number, default: 0 },
    gorduras: { type: Number, default: 0 },
    carboidratos: { type: Number, default: 0 },
});

const DiarioAlimentarSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    refeicoes: {
        cafeDaManha: [AlimentoSchema],
        almoco: [AlimentoSchema],
        jantar: [AlimentoSchema],
        lanches: [AlimentoSchema],
    }
});

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const DiarioAlimentar = mongoose.model('DiarioAlimentar', DiarioAlimentarSchema);


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
        
        // Cria todos os documentos associados para o novo usuário
        await new Checklist({ userId: novoUsuario._id, preOp: [{ descricao: 'Marcar consulta com cirurgião', concluido: false }], posOp: [{ descricao: 'Tomar suplementos vitamínicos', concluido: false }] }).save();
        await new Peso({ userId: novoUsuario._id, registros: [] }).save();
        await new Consulta({ userId: novoUsuario._id, consultas: [] }).save();
        await new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();
        await new Medication({ userId: novoUsuario._id, medicamentos: [{ nome: 'Vitamina B12', dosagem: '1000mcg', quantidade: 1, unidade: 'comprimido', vezesAoDia: 1 }], historico: {} }).save();
        await new DiarioAlimentar({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();

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
            from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`,
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

app.listen(PORT, () => console.log(`Servidor do BariPlus rodando na porta ${PORT}`));