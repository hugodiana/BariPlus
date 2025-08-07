const express = require('express');
const router = express.Router();
const examsController = require('../controllers/examsController');
const autenticar = require('../middlewares/autenticar');

// ✅ CORREÇÃO: As rotas foram renomeadas para a versão em português "exames"
router.get('/exames', autenticar, examsController.getExams);
router.post('/exames/type', autenticar, examsController.addExamType);
router.post('/exames/result/:examEntryId', autenticar, examsController.addExamResult);
router.put('/exames/result/:examEntryId/:resultId', autenticar, examsController.updateExamResult);
router.delete('/exames/result/:examEntryId/:resultId', autenticar, examsController.deleteExamResult);

module.exports = router;