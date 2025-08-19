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
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    titulo: { type: String, required: true }, // Ex: "Plano de Ganho de Massa - Semana 1"
    refeicoes: [refeicaoSchema],
    observacoesGerais: String,
    ativo: { type: Boolean, default: true }, // Para marcar se este é o plano atual do paciente
    isTemplate: { type: Boolean, default: false }, 
    templateName: { type: String, trim: true } 
}, { timestamps: true });

const PlanoAlimentar = mongoose.model('PlanoAlimentar', PlanoAlimentarSchema);
module.exports = PlanoAlimentar;