const express = require('express');
const router = express.Router();
const examsController = require('../controllers/examsController');
const autenticar = require('../middlewares/autenticar');
const verificarPagamento = require('../middlewares/verificarPagamento');

// ✅ CORREÇÃO: As rotas foram renomeadas de volta para a versão em inglês "exams"
router.get('/exams', autenticar, verificarPagamento, examsController.getExams);
router.post('/exams/type', autenticar, verificarPagamento, examsController.addExamType);
router.post('/exams/result/:examEntryId', autenticar, verificarPagamento, examsController.addExamResult);
router.put('/exams/result/:examEntryId/:resultId', autenticar, verificarPagamento, examsController.updateExamResult);
router.delete('/exams/result/:examEntryId/:resultId', autenticar, examsController.deleteExamResult);

module.exports = router;