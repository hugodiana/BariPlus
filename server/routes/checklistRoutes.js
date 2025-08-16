const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento'); // 1. Importe o novo middleware

// 2. Adicione 'verificarPagamento' depois de 'autenticar' em todas as rotas
router.get('/checklist', autenticar, verificarPagamento, checklistController.getChecklist);
router.post('/checklist', autenticar, verificarPagamento, checklistController.addItem);
router.put('/checklist/:itemId', autenticar, verificarPagamento, checklistController.updateItem);
router.delete('/checklist/:itemId', autenticar, verificarPagamento, checklistController.deleteItem);

module.exports = router;