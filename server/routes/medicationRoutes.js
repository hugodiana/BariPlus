const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const autenticar = require('../middlewares/autenticar');

router.get('/medication', autenticar, medicationController.getMedication);
router.post('/medication', autenticar, medicationController.addMedication);
router.post('/medication/log', autenticar, medicationController.logMedication);
router.put('/medication/:medId/status', autenticar, medicationController.updateStatus);
router.delete('/medication/:medId', autenticar, medicationController.deleteMedication);

module.exports = router;