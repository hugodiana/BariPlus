// server/routes/nutriRoutes.js

const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/nutriController');
const { protectNutri } = require('../middlewares/authNutri');

// Todas as rotas aqui dentro já serão protegidas e só acessíveis por nutris logados.
// GET /api/nutri/dashboard
router.get('/dashboard', protectNutri, getDashboardData);

// Futuramente, outras rotas do nutricionista virão aqui. Ex:
// router.get('/pacientes', protectNutri, ...);
// router.post('/convites', protectNutri, ...);

module.exports = router;