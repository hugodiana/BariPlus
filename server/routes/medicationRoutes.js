const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const autenticar = require('../middlewares/autenticar');

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/medication', autenticar, medicationController.getMedication);
router.post('/medication', autenticar, medicationController.addMedication);
router.post('/medication/log', autenticar, medicationController.logMedication);
router.delete('/medication/:medId', autenticar, medicationController.deleteMedication);

module.exports = router;