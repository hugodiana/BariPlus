// server/models/Prontuario.js
const mongoose = require('mongoose');

// Subdocumento para Avaliações Antropométricas
const AvaliacaoSchema = new mongoose.Schema({
    data: { type: Date, default: Date.now },
    peso: Number,
    altura: Number,
    imc: Number,
    circunferencias: {
        bracoDireito: Number,
        bracoEsquerdo: Number,
        cintura: Number,
        abdomen: Number,
        quadril: Number,
        coxaDireita: Number,
        coxaEsquerda: Number
    },
    dobrasCutaneas: {
        triceps: Number,
        subescapular: Number,
        suprailiaca: Number,
        abdominal: Number,
        coxa: Number,
        panturrilha: Number
    },
    observacoes: String
}, { _id: true, timestamps: true });

// Subdocumento para Histórico Alimentar (Recordatório)
const RecordatorioItemSchema = new mongoose.Schema({
    refeicao: String, // Ex: "Pequeno-almoço"
    horario: String,
    alimentos: String
}, { _id: false });

const ProntuarioSchema = new mongoose.Schema({
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    
    // ANAMNESE ESTRUTURADA
    dadosPessoais: {
        dataNascimento: Date,
        telefone: String,
        profissao: String,
        estadoCivil: String,
    },
    historicoClinico: {
        doencasPrevias: [String],
        alergias: String,
        intolerancias: String,
        medicamentosEmUso: String,
        historicoFamiliar: String,
        cirurgiasAnteriores: String
    },
    habitosDeVida: {
        atividadeFisica: String,
        tabagismo: String,
        consumoAlcool: String,
        qualidadeSono: String,
        funcaoIntestinal: String,
        consumoAgua: Number, // em ml
    },
    historicoAlimentar: {
        refeicoesPorDia: Number,
        preferencias: String,
        aversoes: String,
        comePorEmocao: String, // Sim, Não, Às vezes
        beliscaEntreRefeicoes: String, // Sim, Não, Às vezes
        recordatorio24h: [RecordatorioItemSchema]
    },
    objetivo: String,
    
    // EVOLUÇÃO E AVALIAÇÕES
    avaliacoes: [AvaliacaoSchema],
    evolucao: [{
        data: { type: Date, default: Date.now },
        nota: { type: String, required: true }
    }]

}, { timestamps: true });

const Prontuario = mongoose.model('Prontuario', ProntuarioSchema);

module.exports = Prontuario;