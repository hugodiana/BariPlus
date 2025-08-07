const mongoose = require('mongoose');

const PesoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    registros: [{
        peso: Number,
        data: { type: Date, default: Date.now },
        fotoUrl: String,
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

const Peso = mongoose.model('Peso', PesoSchema);

module.exports = Peso;