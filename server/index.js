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

// --- CONEXÃO COM O BANCO DE DADOS ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Falha ao conectar ao MongoDB:', err));

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
const User = mongoose.model('User', UserSchema);

const ChecklistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preOp: [{ descricao: String, concluido: Boolean }],
    posOp: [{ descricao: String, concluido: Boolean }]
});
const Checklist = mongoose.model('Checklist', ChecklistSchema);

const PesoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registros: [{ peso: Number, data: Date }]
});
const Peso = mongoose.model('Peso', PesoSchema);

const ConsultaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }]
});
const Consulta = mongoose.model('Consulta', ConsultaSchema);

const DailyLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Formato YYYY-MM-DD
    waterConsumed: { type: Number, default: 0 }, // Em ml
    proteinConsumed: { type: Number, default: 0 } // Em g
});
const DailyLog = mongoose.model('DailyLog', DailyLogSchema);


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

// ROTA DE REGISTO (COM CORREÇÃO PARA INCLUIR DAILYLOG)
app.post('/api/register', async (req, res) => {
  try {
    const { nome, sobrenome, username, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Este nome de utilizador já está em uso.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const novoUsuario = new User({ nome, sobrenome, username, email, password: hashedPassword });
    await novoUsuario.save();

    // Cria os documentos associados para o novo utilizador
    await new Checklist({ userId: novoUsuario._id, preOp: [ { descricao: 'Marcar consulta com cirurgião', concluido: false }, { descricao: 'Passar com nutricionista', concluido: false } ], posOp: [ { descricao: 'Tomar suplementos vitamínicos', concluido: false } ] }).save();
    await new Peso({ userId: novoUsuario._id, registros: [] }).save();
    await new Consulta({ userId: novoUsuario._id, consultas: [] }).save();
    // ✅ CORREÇÃO: Criação do log diário que estava em falta
    await new DailyLog({ userId: novoUsuario._id, date: new Date().toISOString().split('T')[0] }).save();

    res.status(201).json({ message: 'Utilizador criado com sucesso!' });
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
    if (!usuario) return res.status(404).json({ message: "Utilizador não encontrado." });
    res.json(usuario);
  } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/onboarding', autenticar, async (req, res) => {
  try {
    const userId = req.userId;
    // Os dados podem vir incompletos, e está tudo bem
    const { fezCirurgia, dataCirurgia, altura, pesoInicial } = req.body;
    
    const pesoNum = parseFloat(pesoInicial);
    
    // Monta o objeto de detalhes com os dados que temos
    const detalhes = {
        fezCirurgia: fezCirurgia,
        dataCirurgia: dataCirurgia || null, // Guarda null se a data vier vazia
        altura: parseFloat(altura),
        pesoInicial: pesoNum,
        pesoAtual: pesoNum 
    };

    const usuario = await User.findByIdAndUpdate(req.userId, {
        $set: {
          detalhesCirurgia: detalhes, // Guarda o objeto de detalhes
          onboardingCompleto: true
        }
      }, { new: true });

    if (!usuario) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    
    // Adiciona o primeiro registo de peso ao histórico
    await Peso.findOneAndUpdate(
        { userId: req.userId }, 
        { $push: { registros: { peso: pesoNum, data: new Date() } } }
    );

    res.status(200).json({ message: 'Dados guardados com sucesso!' });
  } catch (error) { 
    console.error("Erro no onboarding:", error);
    res.status(500).json({ message: 'Erro no servidor ao guardar detalhes.' }); 
  }
});

// ROTAS DE PESOS
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

// ROTAS DE CHECKLIST
app.get('/api/checklist', autenticar, async (req, res) => {
    const checklistDoc = await Checklist.findOne({ userId: req.userId });
    res.json(checklistDoc || { preOp: [], posOp: [] });
});
app.post('/api/checklist', autenticar, async (req, res) => {
    const { descricao, type } = req.body;
    const novoItem = { descricao, concluido: false };
    const update = { $push: { [type]: novoItem  } };
    const result = await Checklist.findOneAndUpdate({ userId: req.userId }, update, { new: true });
    res.status(201).json(result[type][result[type].length - 1]);
});
app.put('/api/checklist/:itemId', autenticar, async (req, res) => {
    const { itemId } = req.params;
    const { concluido, type } = req.body;
    if (type !== 'preOp' && type !== 'posOp') return res.status(400).json({ message: "Tipo de checklist inválido" });
    try {
        const checklistDoc = await Checklist.findOne({ userId: req.userId });
        if (!checklistDoc) return res.status(404).json({ message: "Checklist não encontrado." });
        const item = checklistDoc[type].id(itemId);
        if (!item) return res.status(404).json({ message: "Item não encontrado." });
        item.concluido = concluido;
        await checklistDoc.save();
        res.json(item);
    } catch (error) { res.status(500).json({ message: "Erro ao atualizar item." }); }
});
app.delete('/api/checklist/:itemId', autenticar, async (req, res) => {
    const { itemId } = req.params;
    const { type } = req.query;
    if (type !== 'preOp' && type !== 'posOp') return res.status(400).json({ message: "Tipo de checklist inválido" });
    try {
        await Checklist.findOneAndUpdate({ userId: req.userId }, { $pull: { [type]: { _id: itemId } } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Erro ao apagar item." }); }
});

// ROTAS DE CONSULTAS
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
app.delete('/api/consultas/:consultaId', autenticar, async (req, res) => {
    const { consultaId } = req.params;
    await Consulta.findOneAndUpdate({ userId: req.userId }, { $pull: { consultas: { _id: consultaId } } });
    res.status(204).send();
});

// ✅ ROTAS QUE ESTAVAM EM FALTA PARA METAS DIÁRIAS
app.get('/api/dailylog/today', autenticar, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let log = await DailyLog.findOne({ userId: req.userId, date: today });
        if (!log) {
            log = new DailyLog({ userId: req.userId, date: today });
            await log.save();
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar log diário." });
    }
});
app.post('/api/dailylog/track', autenticar, async (req, res) => {
    try {
        const { type, amount } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const fieldToUpdate = type === 'water' ? 'waterConsumed' : 'proteinConsumed';
        const updatedLog = await DailyLog.findOneAndUpdate(
            { userId: req.userId, date: today },
            { $inc: { [fieldToUpdate]: amount } },
            { new: true, upsert: true }
        );
        res.json(updatedLog);
    } catch (error) {
        res.status(500).json({ message: "Erro ao registar consumo." });
    }
});

// --- ROTA PARA ADICIONAR/ATUALIZAR DATA DA CIRURGIA ---
app.put('/api/user/surgery-date', autenticar, async (req, res) => {
  try {
    const { dataCirurgia } = req.body;
    if (!dataCirurgia) {
      return res.status(400).json({ message: "A data da cirurgia é obrigatória." });
    }

    // Encontra o utilizador pelo ID do token e atualiza apenas o campo da data da cirurgia
    const usuarioAtualizado = await User.findByIdAndUpdate(
      req.userId,
      { $set: { "detalhesCirurgia.dataCirurgia": dataCirurgia } },
      { new: true } // Retorna o documento atualizado
    ).select('-password');

    if (!usuarioAtualizado) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    res.json(usuarioAtualizado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no servidor ao atualizar a data." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor do BariPlus a correr na porta ${PORT}`);
});