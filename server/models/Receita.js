// server/models/Receita.js
const mongoose = require('mongoose');

// ✅ NOVO: Definimos um schema específico para o alimento
const AlimentoSchema = new mongoose.Schema({
    description: { type: String, required: true },
    kcal: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbohydrates: { type: Number, default: 0 },
    lipids: { type: Number, default: 0 },
}, { _id: false });


const IngredienteSchema = new mongoose.Schema({
    // ✅ CORREÇÃO: O alimento agora usa o schema que definimos
    alimento: { type: AlimentoSchema, required: true },
    quantidade: { type: Number, required: true }, // Quantidade em gramas
    medidaCaseira: { type: String, required: true } // Ex: "1 fatia", "1 chávena"
}, { _id: false });


const ReceitaSchema = new mongoose.Schema({
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista', required: true },
    nome: { type: String, required: true },
    ingredientes: [IngredienteSchema],
    modoDePreparo: { type: String },
    totais: {
        kcal: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbohydrates: { type: Number, default: 0 },
        lipids: { type: Number, default: 0 },
    }
}, { timestamps: true });

const Receita = mongoose.model('Receita', ReceitaSchema);
module.exports = Receita;