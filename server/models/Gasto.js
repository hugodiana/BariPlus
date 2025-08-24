const mongoose = require('mongoose');

const GastoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registros: [{
        descricao: { type: String, required: true },
        valor: { type: Number, required: true },
        data: { type: Date, default: Date.now },
        categoria: { type: String, default: 'Outros' }
    }]
});

GastoSchema.index({ 'registros.data': 1 });
GastoSchema.index({ 'registros.categoria': 1 });

const Gasto = mongoose.model('Gasto', GastoSchema);

module.exports = Gasto;