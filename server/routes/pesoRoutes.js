const express = require('express');
const router = express.Router();
const pesoController = require('../controllers/pesoController');
const autenticar = require('../middlewares/autenticar');
const multer = require('multer');
const verificarPagamento = require('../middlewares/verificarPagamento');


const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define as rotas e protege-as com o middleware 'autenticar'
router.get('/pesos', autenticar, verificarPagamento, pesoController.getPesos);
router.post('/pesos', autenticar, verificarPagamento, upload.single('foto'), pesoController.addPeso);
router.put('/pesos/:registroId', autenticar, verificarPagamento, upload.single('foto'), pesoController.updatePeso);
router.delete('/pesos/:registroId', autenticar, verificarPagamento, pesoController.deletePeso);

module.exports = router;