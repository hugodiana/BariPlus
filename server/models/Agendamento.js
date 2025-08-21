// server/models/Agendamento.js
const mongoose = require('mongoose');
const crypto = require('crypto'); // ✅ 1. IMPORTAR A BIBLIOTECA CRYPTO

const agendamentoSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    pacienteId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'pacienteModel' }, // refPath é mais flexível
    pacienteModel: { type: String, required: true, enum: ['User', 'PacienteNutri'] },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['Agendado', 'Confirmado', 'Realizado', 'Cancelado'], 
        default: 'Agendado' 
    },
    observacoes: String,
    
    // ✅ 2. NOVOS CAMPOS PARA CONFIRMAÇÃO
    confirmationToken: { type: String, default: () => crypto.randomBytes(32).toString('hex') },
    lembreteEnviado: { type: Boolean, default: false }

}, { timestamps: true });

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);
module.exports = Agendamento;