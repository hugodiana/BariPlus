// server/models/conviteModel.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const conviteSchema = new mongoose.Schema({
  nutricionistaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nutricionista',
    required: true
  },
  codigo: {
    type: String,
    default: () => uuidv4(),
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
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
  }
});

const Convite = mongoose.model('Convite', conviteSchema);
module.exports = Convite;