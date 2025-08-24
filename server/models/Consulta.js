const mongoose = require('mongoose');

const ConsultaSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true
    },
    consultas: [{
        especialidade: String,
        data: { type: Date, required: true },
        local: String,
        notas: String,
        status: { type: String, enum: ['Agendado', 'Realizado', 'Cancelado'], default: 'Agendado' }
    }]
});

ConsultaSchema.index({ 'consultas.data': 1 });

const Consulta = mongoose.model('Consulta', ConsultaSchema);

module.exports = Consulta;