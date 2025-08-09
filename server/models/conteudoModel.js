const mongoose = require('mongoose');

const ConteudoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    resumo: { type: String, required: true }, // Um pequeno texto para os cards
    conteudoCompleto: { type: String, required: true }, // O corpo do artigo, pode conter HTML
    imagemDeCapa: { type: String }, // URL da imagem do Cloudinary
    tipo: { 
        type: String, 
        enum: ['Artigo', 'Receita', 'Vídeo'], 
        default: 'Artigo' 
    },
    autor: { type: String, default: 'Equipa BariPlus' },
    publicado: { type: Boolean, default: false } // Para controlar a visibilidade
}, { timestamps: true });

const Conteudo = mongoose.model('Conteudo', ConteudoSchema);

module.exports = Conteudo;