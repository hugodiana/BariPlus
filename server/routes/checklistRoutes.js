const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/checklist', autenticar, checklistController.getChecklist);
router.post('/checklist', autenticar, checklistController.addItem);
router.put('/checklist/:itemId', autenticar, checklistController.updateItem);
router.delete('/checklist/:itemId', autenticar, checklistController.deleteItem);

module.exports = router;