const express = require('express');
const router = express.Router();
const conteudoController = require('../controllers/conteudoController');
const autenticar = require('../middlewares/autenticar');
const isAdmin = require('../middlewares/isAdmin');

// --- Rotas para o App (Abertas para qualquer usuário logado) ---
router.get('/conteudos', autenticar, conteudoController.listarConteudosPublicados);
router.get('/conteudos/:id', autenticar, conteudoController.getConteudoPorId);

// --- Rotas para o Painel de Admin (Protegidas) ---
router.post('/admin/conteudos', autenticar, isAdmin, conteudoController.criarConteudo);
router.get('/admin/conteudos', autenticar, isAdmin, conteudoController.listarTodosConteudosAdmin);
router.put('/admin/conteudos/:id', autenticar, isAdmin, conteudoController.atualizarConteudo);
router.delete('/admin/conteudos/:id', autenticar, isAdmin, conteudoController.apagarConteudo);
router.get('/conteudos/related/:currentId', autenticar, conteudoController.listarConteudosRelacionados);

module.exports = router;