const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Usaremos UUID para gerar códigos únicos

const conviteSchema = new mongoose.Schema({
  nutricionistaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nutricionista',
    required: true
  },
  codigo: {
    type: String,
    default: () => uuidv4(), // Gera um código único automaticamente
    unique: true
  },
  emailPaciente: { type: String },
  status: {
    type: String,
    enum: ['pendente', 'aceito', 'expirado'],
    default: 'pendente'
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    // O convite expira em 7 dias por padrão
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});

const Convite = mongoose.model('Convite', conviteSchema);
module.exports = Convite;