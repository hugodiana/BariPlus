// server/routes/alimentoRoutes.js
const express = require('express');
const router = express.Router();
const { protectNutri } = require('../middlewares/authNutri');
const { addAlimento, deleteAlimento } = require('../controllers/alimentoController');

router.route('/')
    .post(protectNutri, addAlimento);
    
router.route('/:alimentoId')
    .delete(protectNutri, deleteAlimento);

module.exports = router;