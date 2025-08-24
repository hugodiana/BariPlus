// server/models/RefeicaoTemplate.js
const mongoose = require('mongoose');

const refeicaoItemSchema = new mongoose.Schema({
    alimento: { type: String, required: true },
    quantidade: { type: String, required: true },
}, { _id: false });

const RefeicaoTemplateSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    nome: { type: String, required: true }, // Ex: "Pequeno-almoço rico em proteína"
    horario: String, // Ex: "08:00"
    itens: [refeicaoItemSchema]
}, { timestamps: true });

RefeicaoTemplateSchema.index({ nutricionistaId: 1 });
RefeicaoTemplateSchema.index({ nome: 1 });
RefeicaoTemplateSchema.index({ createdAt: 1 });

const RefeicaoTemplate = mongoose.model('RefeicaoTemplate', RefeicaoTemplateSchema);
module.exports = RefeicaoTemplate;