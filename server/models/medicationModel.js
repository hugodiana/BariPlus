const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    medicamentos: [{
        nome: String,
        dosagem: String,
        quantidade: Number,
        unidade: String,
        // ✅ ALTERAÇÃO: Nova estrutura de frequência
        frequencia: {
            tipo: { type: String, enum: ['Diária', 'Semanal', 'Mensal'], required: true },
            // Para 'Diária', guarda uma lista de horários
            horarios: [{ type: String }], // Ex: ["08:00", "14:00", "22:00"]
            // Para 'Semanal', guarda o dia da semana (0=Domingo, 1=Segunda, etc.)
            diaDaSemana: Number,
        },
        status: { type: String, enum: ['Ativo', 'Inativo'], default: 'Ativo' }
    }],
    historico: {
        type: Map,
        of: Map, // Estrutura: { 'YYYY-MM-DD': { 'medId': count } }
        default: {}
    }
});

const Medication = mongoose.model('Medication', MedicationSchema);

module.exports = Medication;