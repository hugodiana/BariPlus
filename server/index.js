const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const JWT_SECRET = 'seu-segredo-super-secreto-mude-depois';

const usuarios = [];
const checklists = {};

// --- ROTA DE CADASTRO ATUALIZADA ---
app.post('/api/register', async (req, res) => {
  try {
    // NOVIDADE: Capturando os novos campos
    const { nome, sobrenome, username, email, password } = req.body;

    // NOVIDADE: Validando se email ou username já existem
    if (usuarios.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }
    if (usuarios.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // NOVIDADE: Salvando o usuário com todos os campos
    const novoUsuario = { id: usuarios.length + 1, nome, sobrenome, username, email, password: hashedPassword };
    usuarios.push(novoUsuario);

    checklists[novoUsuario.id] = [
        { id: 1, descricao: 'Marcar consulta com cirurgião', concluido: false },
        { id: 2, descricao: 'Realizar endoscopia digestiva alta', concluido: false },
    ];

    console.log('Usuários cadastrados:', usuarios);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// --- ROTA DE LOGIN ATUALIZADA ---
app.post('/api/login', async (req, res) => {
    try {
        // NOVIDADE: Usando um "identifier" para aceitar email ou username
        const { identifier, password } = req.body;

        // NOVIDADE: Lógica para encontrar por email ou username
        const usuario = usuarios.find(u => u.email === identifier || u.username === identifier);

        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ userId: usuario.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: 'Login bem-sucedido!' });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
});