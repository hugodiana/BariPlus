// server/models/Agendamento.js
const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    
    // O paciente pode ser de qualquer um dos dois modelos
    pacienteId: { type: mongoose.Schema.Types.ObjectId, required: true },
    pacienteModel: { type: String, required: true, enum: ['User', 'PacienteNutri'] },
    
    title: { type: String, required: true }, // Ex: "Consulta de Retorno - Hugo Diana"
    start: { type: Date, required: true }, // Data e hora de início
    end: { type: Date, required: true },   // Data e hora de fim
    status: { 
        type: String, 
        enum: ['Agendado', 'Confirmado', 'Realizado', 'Cancelado'], 
        default: 'Agendado' 
    },
    observacoes: String
}, { timestamps: true });

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);
module.exports = Agendamento;