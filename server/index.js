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
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto-mude-depois';

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Conectado ao MongoDB com sucesso!'))
  .catch(err => console.error('Falha ao conectar ao MongoDB:', err));

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sobrenome: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    onboardingCompleto: { type: Boolean, default: false },
    detalhesCirurgia: {
        fezCirurgia: String,
        dataCirurgia: Date,
        altura: Number,
        pesoInicial: Number,
        pesoAtual: Number
    }
});
const User = mongoose.model('User', UserSchema);


// ROTA DE CADASTRO (JÁ REFATORADA)
app.post('/api/register', async (req, res) => {
  try {
    const { nome, sobrenome, username, email, password } = req.body;
    const emailExistente = await User.findOne({ email });
    if (emailExistente) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    const usernameExistente = await User.findOne({ username });
    if (usernameExistente) return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const novoUsuario = new User({ nome, sobrenome, username, email, password: hashedPassword });
    await novoUsuario.save();
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// ROTA DE LOGIN (AGORA REFATORADA)
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ userId: usuario._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Login bem-sucedido!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// As outras rotas (onboarding, pesos, checklist, etc.) ainda precisam ser refatoradas.

app.listen(PORT, () => {
  console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
});