const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const autenticar = require('../middlewares/autenticar');

// Rotas para gerenciar a LISTA de medicamentos
router.get('/medication/list', autenticar, medicationController.getMedicationList);
router.post('/medication', autenticar, medicationController.addMedication);
router.put('/medication/:medId/status', autenticar, medicationController.updateStatus);
router.delete('/medication/:medId', autenticar, medicationController.deleteMedication);

// Rotas para gerenciar o HISTÓRICO de doses tomadas
router.get('/medication/log/:date', autenticar, medicationController.getMedicationLogByDate);
router.post('/medication/log/toggle', autenticar, medicationController.toggleDoseTaken);

module.exports = router;