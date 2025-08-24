// server/models/PlanoAlimentar.js
const mongoose = require('mongoose');

// ✅ SUBDOCUMENTO ATUALIZADO PARA INCLUIR NUTRIENTES
const refeicaoItemSchema = new mongoose.Schema({
    alimento: { type: String, required: true },
    quantidade: { type: String, required: true }, // Ex: "1 fatia", "100g"
    
    // Novos campos para guardar os dados nutricionais por 100g
    base_kcal: { type: Number, default: 0 },
    base_protein: { type: Number, default: 0 },
    base_carbs: { type: Number, default: 0 },
    base_fats: { type: Number, default: 0 },
    
    // Campo para a porção em gramas definida pelo nutri
    porcao: { type: Number, default: 100 }

}, { _id: false });

const refeicaoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    horario: String,
    itens: [refeicaoItemSchema]
}, { _id: false });

const PlanoAlimentarSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    titulo: { type: String, required: true },
    metas: {
        vet: { type: Number, default: 0 }, // Valor Energético Total (Kcal)
        carboidratos_percent: { type: Number, default: 40 },
        proteinas_percent: { type: Number, default: 30 },
        gorduras_percent: { type: Number, default: 30 }
    },
    refeicoes: [refeicaoSchema],
    observacoesGerais: String,
    ativo: { type: Boolean, default: true },
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String, trim: true }
}, { timestamps: true });

PlanoAlimentarSchema.index({ nutricionistaId: 1 });
PlanoAlimentarSchema.index({ pacienteId: 1 });
PlanoAlimentarSchema.index({ ativo: 1 });
PlanoAlimentarSchema.index({ isTemplate: 1 });
PlanoAlimentarSchema.index({ createdAt: 1 });

const PlanoAlimentar = mongoose.model('PlanoAlimentar', PlanoAlimentarSchema);
module.exports = PlanoAlimentar;