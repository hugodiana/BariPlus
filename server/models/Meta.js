// server/models/Meta.js
const mongoose = require('mongoose');

const MetaSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    descricao: { type: String, required: true }, // Ex: "Beber 2.5L de água por dia"
    tipo: { 
        type: String, 
        enum: ['agua', 'proteina', 'registro_peso', 'registro_diario', 'outro'],
        required: true 
    },
    valorAlvo: { type: Number }, // Ex: 2500 (para água em ml) ou 5 (para 5 registos)
    unidade: { type: String }, // Ex: "ml", "g", "dias"
    prazo: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['ativa', 'concluida', 'nao_concluida'], 
        default: 'ativa' 
    },
}, { timestamps: true });

MetaSchema.index({ nutricionistaId: 1 });
MetaSchema.index({ pacienteId: 1 });
MetaSchema.index({ status: 1 });
MetaSchema.index({ prazo: 1 });
MetaSchema.index({ createdAt: 1 });

const Meta = mongoose.model('Meta', MetaSchema);
module.exports = Meta;