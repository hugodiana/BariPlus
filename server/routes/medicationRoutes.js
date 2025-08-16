const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// Rotas para gerenciar a LISTA de medicamentos
router.get('/medication/list', autenticar, verificarPagamento, medicationController.getMedicationList);
router.post('/medication', autenticar, verificarPagamento, medicationController.addMedication);
router.put('/medication/:medId/status', autenticar, verificarPagamento, medicationController.updateStatus);
router.delete('/medication/:medId', autenticar, verificarPagamento, medicationController.deleteMedication);

// Rotas para gerenciar o HISTÓRICO de doses tomadas
router.get('/medication/log/:date', autenticar, medicationController.getMedicationLogByDate);
router.post('/medication/log/toggle', autenticar, medicationController.toggleDoseTaken);

module.exports = router;