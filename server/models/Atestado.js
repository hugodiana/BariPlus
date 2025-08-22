// server/models/Atestado.js
const mongoose = require('mongoose');

const AtestadoSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { type: String, enum: ['simples', 'acompanhante'], required: true },
    dataConsulta: { type: Date, required: true },
    horaInicio: { type: String },
    horaFim: { type: String },
    nomeAcompanhante: { type: String },
    motivo: { type: String },
    textoCompleto: { type: String, required: true } // O texto final do atestado gerado
}, { timestamps: true });

const Atestado = mongoose.model('Atestado', AtestadoSchema);
module.exports = Atestado;