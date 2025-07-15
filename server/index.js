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
const UserSchema = new mongoose.Schema({ nome: String, sobrenome: String, username: { type: String, required: true, unique: true }, email: { type: String, required: true, unique: true }, password: { type: String, required: true }, onboardingCompleto: { type: Boolean, default: false }, detalhesCirurgia: { fezCirurgia: String, dataCirurgia: Date, altura: Number, pesoInicial: Number, pesoAtual: Number } });
const ChecklistSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, preOp: [{ descricao: String, concluido: Boolean }], posOp: [{ descricao: String, concluido: Boolean }] });
const PesoSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, registros: [{ peso: Number, data: Date, fotoUrl: String, medidas: { cintura: Number, quadril: Number, braco: Number } }] });
const ConsultaSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, consultas: [{ especialidade: String, data: Date, local: String, notas: String, status: String }] });
const DailyLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, date: { type: String, required: true }, waterConsumed: { type: Number, default: 0 }, proteinConsumed: { type: Number, default: 0 } });
const MedicationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, medicamentos: [{ nome: String, dosagem: String, quantidade: Number, unidade: String, vezesAoDia: Number }], historico: { type: Map, of: Number, default: {} } });

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

// ROTA PARA ENVIAR E-MAIL DE REDEFINIÇÃO DE SENHA
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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER, // Usa o Login da Brevo
        pass: process.env.SMTP_PASS, // Usa a Senha Mestra da Brevo
      },
    });

    await transporter.sendMail({
      from: `"BariPlus" <${process.env.MAIL_FROM_ADDRESS}>`, // ✅ CORREÇÃO: Usa o seu e-mail validado
      to: usuario.email,
      subject: "Redefinição de Senha - BariPlus",
      html: `<p>Olá ${usuario.nome},</p><p>Para redefinir sua senha, clique no link abaixo:</p><a href="${resetLink}">Redefinir Senha</a><p>Este link é válido por 15 minutos.</p>`,
    });

    res.json({ message: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." });
  } catch (error) {
    console.error("Erro no forgot-password:", error);
    res.status(500).json({ message: "Erro no servidor." });
  }
});

// ROTA PARA EFETIVAMENTE REDEFINIR A SENHA
app.post('/api/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;
    const { password } = req.body;
    try {
        const usuario = await User.findById(userId);
        if (!usuario) return res.status(400).json({ message: "Link inválido ou expirado." });

        const resetSecret = JWT_SECRET + usuario.password;
        jwt.verify(token, resetSecret); // Se não der erro, o token é válido

        const hashedPassword = await bcrypt.hash(password, 10);
        usuario.password = hashedPassword;
        await usuario.save();

        res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
        console.error("Erro no reset-password:", error);
        res.status(400).json({ message: "Link inválido ou expirado." });
    }
});


// ... (todas as outras rotas para 'me', 'onboarding', 'pesos', 'checklist', 'consultas', 'dailylog', 'medication' continuam aqui) ...


app.listen(PORT, () => console.log(`Servidor do BariPlus rodando na porta ${PORT}`));