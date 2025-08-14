const mongoose = require('mongoose');

const DoseSchema = new mongoose.Schema({
    medicationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    nome: { type: String, required: true },
    horario: { type: String, required: true }, // Ex: "08:00"
    dosagem: String,
}, { _id: true }); // Garante que cada dose tenha um ID único

const MedicationLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Formato 'YYYY-MM-DD'
    dosesTomadas: [DoseSchema]
});

// Cria um índice composto para garantir buscas rápidas e que cada usuário tenha apenas um log por dia
MedicationLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const MedicationLog = mongoose.model('MedicationLog', MedicationLogSchema);

module.exports = MedicationLog;