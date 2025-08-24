// server/models/Peso.js
const mongoose = require('mongoose');

const PesoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true 
    },
    registros: [{
        peso: Number,
        data: { type: Date, default: Date.now },
        fotoUrl: String,
        notas: String, // ✅ NOVO CAMPO ADICIONADO AQUI
        medidas: {
            // Tronco
            pescoco: Number,
            torax: Number,
            cintura: Number,
            abdomen: Number,
            quadril: Number,
            // Membros
            bracoDireito: Number,
            bracoEsquerdo: Number,
            antebracoDireito: Number,
            antebracoEsquerdo: Number,
            coxaDireita: Number,
            coxaEsquerda: Number,
            panturrilhaDireita: Number,
            panturrilhaEsquerda: Number
        }
    }]
}, { timestamps: true });

PesoSchema.index({ 'registros.data': 1 });

const Peso = mongoose.model('Peso', PesoSchema);

module.exports = Peso;