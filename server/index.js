require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Conectado ao MongoDB com sucesso!')).catch(err => console.error('Falha na conexão:', err));

// --- SCHEMAS E MODELOS ---
const UserSchema = new mongoose.Schema({ nome: String, sobrenome: String, username: { type: String, required: true, unique: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true }, onboardingCompleto: { type: Boolean, default: false }, detalhesCirurgia: { fezCirurgia: String, dataCirurgia: Date, altura: Number, pesoInicial: Number, pesoAtual: Number } });
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const PesoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, registros: [{ peso: Number, data: Date }] });
const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, date: { type: String, required: true }, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Number, default: {} } });

const User = mongoose.model('User', UserSchema);
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Peso = mongoose.model('Peso', PesoSchema);
const Consulta = mongoose.model('Consulta', ConsultaSchema);
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);
const Medication = mongoose.model('Medication', MedicationSchema);

// --- MIDDLEWARE ---
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
        await new Checklist({ userId: novoUsuario._id, preOp: [{ descricao: 'Marcar consulta com cirurgião', concluido: false }, { descricao: 'Passar com nutricionista', concluido: false }], posOp: [{ descricao: 'Tomar suplementos vitamínicos', concluido: false }] }).save();
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
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
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

// PESOS
app.get('/api/pesos', autenticar, async (req, res) => {
    const pesoDoc = await Peso.findOne({ userId: req.userId });
    res.json(pesoDoc ? pesoDoc.registros : []);
});
app.post('/api/pesos', autenticar, async (req, res) => {
    const { peso } = req.body;
    const pesoNum = parseFloat(peso);
    await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": pesoNum } });
    const result = await Peso.findOneAndUpdate({ userId: req.userId }, { $push: { registros: { peso: pesoNum, data: new Date() } } }, { new: true });
    res.status(201).json(result.registros[result.registros.length - 1]);
});

// CHECKLIST
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

// CONSULTAS
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
        itemDaConsulta.especialidade = especialidade;
        itemDaConsulta.data = data;
        itemDaConsulta.local = local;
        itemDaConsulta.notas = notas;
        await consultaDoc.save();
        res.json(itemDaConsulta);
    } catch (error) { res.status(500).json({ message: "Erro no servidor ao editar consulta." }); }
});
app.delete('/api/consultas/:consultaId', autenticar, async (req, res) => {
    const { consultaId } = req.params;
    await Consulta.findOneAndUpdate({ userId: req.userId }, { $pull: { consultas: { _id: consultaId } } });
    res.status(204).send();
});

// METAS DIÁRIAS
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

// MEDICAÇÃO
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

app.listen(PORT, () => console.log(`Servidor do BariPlus rodando na porta ${PORT}`));