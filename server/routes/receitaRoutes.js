// server/routes/receitaRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const { criarReceita, listarReceitas, apagarReceita } = require('../controllers/receitaController');

router.use(protectNutri);

router.route('/')
    .post(criarReceita)
    .get(listarReceitas);

router.route('/:id')
    .delete(apagarReceita);

module.exports = router;