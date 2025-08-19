// server/models/PlanoAlimentar.js
const mongoose = require('mongoose');

const refeicaoItemSchema = new mongoose.Schema({
    alimento: { type: String, required: true },
    quantidade: { type: String, required: true }, // Ex: "1 fatia", "100g", "1 concha"
    observacoes: String
}, { _id: false });

const refeicaoSchema = new mongoose.Schema({
    nome: { type: String, required: true }, // Ex: "Pequeno-almoço", "Almoço"
    horario: String, // Ex: "08:00"
    itens: [refeicaoItemSchema]
}, { _id: false });

const PlanoAlimentarSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    // CORREÇÃO: `pacienteId` agora é opcional, pois um template não tem paciente.
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    titulo: { type: String, required: true }, // Ex: "Plano de Ganho de Massa - Semana 1"
    refeicoes: [refeicaoSchema],
    observacoesGerais: String,
    ativo: { type: Boolean, default: true },

    // CORREÇÃO: Adicionados os campos para suportar a funcionalidade de template.
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String, trim: true }

}, { timestamps: true });

const PlanoAlimentar = mongoose.model('PlanoAlimentar', PlanoAlimentarSchema);
module.exports = PlanoAlimentar;