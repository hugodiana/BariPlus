const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    medicamentos: [{
        nome: String,
        dosagem: String,
        quantidade: Number,
        unidade: String,
        vezesAoDia: Number
    }],
    historico: {
        type: Map,
        of: Map,
        default: {}
    }
});

const Medication = mongoose.model('Medication', MedicationSchema);

module.exports = Medication;