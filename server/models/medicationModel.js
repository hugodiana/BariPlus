const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    medicamentos: [{
        nome: String,
        dosagem: String,
        quantidade: Number,
        unidade: String,
        frequencia: {
            tipo: { type: String, enum: ['Diária', 'Semanal'], required: true },
            horarios: [{ type: String }],
            // ✅ ALTERAÇÃO: Agora é um array de números para múltiplos dias
            diasDaSemana: [{ type: Number }],
        },
        status: { type: String, enum: ['Ativo', 'Inativo'], default: 'Ativo' }
    }],
});

const Medication = mongoose.model('Medication', MedicationSchema);

module.exports = Medication;