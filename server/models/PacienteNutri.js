// server/models/PacienteNutri.js
const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
    data: { type: Date, default: Date.now },
    peso: Number,
    altura: Number,
    imc: Number,
    circunferencias: {
        braco: Number,
        cintura: Number,
        abdomen: Number,
        quadril: Number,
    },
    dobrasCutaneas: {
        triceps: Number,
        subescapular: Number,
        suprailiaca: Number,
        abdominal: Number,
    },
    bioimpedancia: {
        percentualGordura: Number,
        massaMuscularKg: Number,
        taxaMetabolicaBasal: Number,
    },
    observacoes: String
}, { _id: true });

const PacienteNutriSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    
    // Dados Pessoais
    nomeCompleto: { type: String, required: true },
    dataNascimento: Date,
    telefone: String,
    email: { type: String, lowercase: true, trim: true },
    
    // Anamnese (campos de exemplo, podem ser expandidos)
    objetivo: String,
    historicoSaude: String,
    historicoFamiliar: String,
    habitos: String,
    
    // Histórico de avaliações
    avaliacoes: [avaliacaoSchema]

}, { timestamps: true });

const PacienteNutri = mongoose.model('PacienteNutri', PacienteNutriSchema);
module.exports = PacienteNutri;