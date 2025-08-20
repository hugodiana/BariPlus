// server/routes/pagamentoRoutes.js
const express = require('express');
const router = express.Router();
const { criarPreferenciaVaga, handleMercadoPagoWebhook } = require('../controllers/pagamentoController');
const { protectNutri } = require('../middlewares/authNutri');

// Rota para o nutricionista criar o link de pagamento (protegida)
router.post('/nutri/pagamentos/criar-preferencia', protectNutri, criarPreferenciaVaga);

// Rota para o webhook do Mercado Pago (pública)
router.post('/pagamentos/webhook-mercadopago', handleMercadoPagoWebhook);

module.exports = router;