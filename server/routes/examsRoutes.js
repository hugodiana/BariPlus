const express = require('express');
const router = express.Router();
const examsController = require('../controllers/examsController');
const autenticar = require('../middlewares/autenticar');

// ✅ CORREÇÃO: As rotas foram renomeadas de volta para a versão em inglês "exams"
router.get('/exams', autenticar, examsController.getExams);
router.post('/exams/type', autenticar, examsController.addExamType);
router.post('/exams/result/:examEntryId', autenticar, examsController.addExamResult);
router.put('/exams/result/:examEntryId/:resultId', autenticar, examsController.updateExamResult);
router.delete('/exams/result/:examEntryId/:resultId', autenticar, examsController.deleteExamResult);

module.exports = router;