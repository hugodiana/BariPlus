const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'seu-segredo-super-secreto-mude-depois';

// --- SIMULAÇÃO DE BANCO DE DADOS ---
const usuarios = [];
const checklists = {};
const pesos = {};
const consultas = {}; // NOVIDADE: Variável para as consultas

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

// --- ROTAS DE USUÁRIO ---
app.post('/api/register', async (req, res) => {
  try {
    const { nome, sobrenome, username, email, password } = req.body;
    if (usuarios.find(u => u.email === email)) return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    if (usuarios.find(u => u.username === username)) return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const novoUsuario = { id: usuarios.length + 1, nome, sobrenome, username, email, password: hashedPassword, onboardingCompleto: false };
    usuarios.push(novoUsuario);

    // Inicializa os dados para o novo usuário
    checklists[novoUsuario.id] = {
      preOp: [ { id: 1, descricao: 'Marcar consulta com cirurgião', concluido: false }, { id: 2, descricao: 'Realizar endoscopia digestiva alta', concluido: false }, { id: 3, descricao: 'Passar com psicóloga', concluido: false }, { id: 4, descricao: 'Passar com nutricionista', concluido: false }, ],
      posOp: [ { id: 1, descricao: 'Tomar suplementos vitamínicos', concluido: false }, { id: 2, descricao: 'Seguir a dieta líquida', concluido: false }, { id: 3, descricao: 'Caminhar por 30 minutos diariamente', concluido: false }, ]
    };
    pesos[novoUsuario.id] = [];
    consultas[novoUsuario.id] = []; // NOVIDADE: Inicializa a lista de consultas
    
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = usuarios.find(u => u.email === identifier || u.username === identifier);
        if (!usuario || !(await bcrypt.compare(password, usuario.password))) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ userId: usuario.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Login bem-sucedido!' });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/api/onboarding', autenticar, (req, res) => {
  try {
    const userId = req.userId;
    const { fezCirurgia, dataCirurgia, altura, pesoInicial } = req.body;
    const usuarioIndex = usuarios.findIndex(u => u.id === userId);
    if (usuarioIndex === -1) return res.status(404).json({ message: 'Usuário não encontrado.' });
    usuarios[usuarioIndex] = { ...usuarios[usuarioIndex], detalhesCirurgia: { fezCirurgia, dataCirurgia, altura, pesoInicial: parseFloat(pesoInicial), pesoAtual: parseFloat(pesoInicial) }, onboardingCompleto: true, };
    pesos[userId].push({ peso: parseFloat(pesoInicial), data: new Date().toISOString() });
    res.status(200).json({ message: 'Dados salvos com sucesso!' });
  } catch (error) { res.status(500).json({ message: 'Erro no servidor ao salvar detalhes.' }); }
});

app.get('/api/me', autenticar, (req, res) => {
    const usuario = usuarios.find(u => u.id === req.userId);
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado."});
    const { password, ...dadosParaEnviar } = usuario;
    res.json(dadosParaEnviar);
});

// --- ROTAS DE PESOS ---
app.post('/api/pesos', autenticar, (req, res) => {
  try {
    const userId = req.userId;
    const { peso } = req.body;
    if (!peso) return res.status(400).json({ message: "O peso é obrigatório." });
    if (!pesos[userId]) { pesos[userId] = []; }
    const novoRegistro = { peso: parseFloat(peso), data: new Date().toISOString() };
    pesos[userId].push(novoRegistro);
    const usuarioIndex = usuarios.findIndex(u => u.id === userId);
    if (usuarioIndex !== -1) { usuarios[usuarioIndex].detalhesCirurgia.pesoAtual = parseFloat(peso); }
    res.status(201).json(novoRegistro);
  } catch (error) { res.status(500).json({ message: 'Erro no servidor ao registrar peso.' }); }
});

app.get('/api/pesos', autenticar, (req, res) => {
  const historico = pesos[req.userId] || [];
  res.json(historico);
});

// --- ROTAS DO CHECKLIST ---
app.get('/api/checklist', autenticar, (req, res) => {
  const userChecklist = checklists[req.userId];
  if (!userChecklist) return res.json({ preOp: [], posOp: [] });
  res.json(userChecklist);
});

app.post('/api/checklist', autenticar, (req, res) => {
  const { descricao, type } = req.body;
  if (!descricao || !type) return res.status(400).json({ message: "Descrição e tipo são obrigatórios." });
  const userChecklist = checklists[req.userId][type];
  const novoId = userChecklist.length > 0 ? Math.max(...userChecklist.map(item => item.id)) + 1 : 1;
  const novoItem = { id: novoId, descricao, concluido: false };
  userChecklist.push(novoItem);
  res.status(201).json(novoItem);
});

app.put('/api/checklist/:itemId', autenticar, (req, res) => {
  const { itemId } = req.params;
  const { concluido, type } = req.body;
  if (type !== 'preOp' && type !== 'posOp') return res.status(400).json({ message: "Tipo de checklist inválido" });
  const userChecklist = checklists[req.userId][type];
  const itemIndex = userChecklist.findIndex(item => item.id == itemId);
  if (itemIndex === -1) return res.status(404).json({ message: "Item não encontrado." });
  userChecklist[itemIndex].concluido = concluido;
  res.json(userChecklist[itemIndex]);
});

app.delete('/api/checklist/:itemId', autenticar, (req, res) => {
  const { itemId } = req.params;
  const { type } = req.query;
  if (type !== 'preOp' && type !== 'posOp') return res.status(400).json({ message: "Tipo de checklist inválido" });
  const userChecklist = checklists[req.userId][type];
  const itemIndex = userChecklist.findIndex(item => item.id == itemId);
  if (itemIndex === -1) return res.status(404).json({ message: "Item não encontrado." });
  userChecklist.splice(itemIndex, 1);
  res.status(204).send();
});

// --- NOVIDADE: ROTAS DA API DE CONSULTAS ---
app.get('/api/consultas', autenticar, (req, res) => {
    const userConsultas = consultas[req.userId] || [];
    res.json(userConsultas);
});

app.post('/api/consultas', autenticar, (req, res) => {
    const { especialidade, data, local, notas } = req.body;
    if (!especialidade || !data) {
        return res.status(400).json({ message: "Especialidade e data são obrigatórias." });
    }
    const userConsultas = consultas[req.userId];
    const novoId = userConsultas.length > 0 ? Math.max(...userConsultas.map(c => c.id)) + 1 : 1;
    
    const novaConsulta = { id: novoId, especialidade, data, local, notas, status: 'Agendado' };
    userConsultas.push(novaConsulta);
    res.status(201).json(novaConsulta);
});

app.delete('/api/consultas/:consultaId', autenticar, (req, res) => {
    const { consultaId } = req.params;
    const userConsultas = consultas[req.userId];
    const consultaIndex = userConsultas.findIndex(c => c.id == consultaId);
    if (consultaIndex === -1) {
        return res.status(404).json({ message: "Consulta não encontrada." });
    }
    userConsultas.splice(consultaIndex, 1);
    res.status(204).send();
});


app.listen(PORT, () => {
  console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
});