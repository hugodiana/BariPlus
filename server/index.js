const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// NOSSA LISTA DE TAREFAS (DADOS FALSOS)
const checklistPreOperatorio = [
  { id: 1, descricao: 'Marcar consulta com cirurgião', concluido: true },
  { id: 2, descricao: 'Realizar endoscopia digestiva alta', concluido: true },
  { id: 3, descricao: 'Passar com psicóloga', concluido: false },
  { id: 4, descricao: 'Passar com nutricionista', concluido: false },
  { id: 5, descricao: 'Fazer exames de sangue completos', concluido: false },
];


app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo ao BariPlus! (Mensagem vinda do servidor!)' });
});

// NOVA ROTA PARA FORNECER O CHECKLIST
app.get('/api/checklist', (req, res) => {
  res.json(checklistPreOperatorio);
});

app.listen(PORT, () => {
  // Nota: Para usar ${PORT} dentro de uma string, a string precisa estar entre crases (`), não aspas simples (').
  console.log(`Servidor do BariPlus rodando na porta ${PORT}`);
});