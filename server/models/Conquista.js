const mongoose = require('mongoose');

const ConquistaSchema = new mongoose.Schema({
    idConquista: { type: String, required: true, unique: true }, // Ex: 'PERDEU_5KG'
    nome: { type: String, required: true },
    descricao: { type: String, required: true },
    icone: { type: String, required: true } // Pode ser um emoji ou o nome de um ícone
});

const Conquista = mongoose.model('Conquista', ConquistaSchema);

module.exports = Conquista;