const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
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

MedicationSchema.index({ 'medicamentos.nome': 1 });
MedicationSchema.index({ 'medicamentos.status': 1 });

const Medication = mongoose.model('Medication', MedicationSchema);

module.exports = Medication;