// server/routes/refeicaoTemplateRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const { criarTemplate, listarTemplates, apagarTemplate } = require('../controllers/refeicaoTemplateController');

// Todas as rotas aqui são protegidas e exclusivas para nutricionistas
router.use(protectNutri);

router.route('/templates')
    .post(criarTemplate)
    .get(listarTemplates);

router.route('/templates/:id')
    .delete(apagarTemplate);

module.exports = router;