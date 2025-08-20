// server/models/Nutricionista.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const nutricionistaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true, select: false },
  crn: { type: String, required: true, unique: true },
  especializacao: { type: String },
  clinica: { type: String },
  
  // ✅ LISTA DE PACIENTES UNIFICADA
  pacientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],

  limiteGratis: { type: Number, default: 10 },
  assinatura: {
      id: String,
      status: { type: String, default: 'inativa' }
  },
}, { timestamps: true });

nutricionistaSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  const hash = await bcrypt.hash(this.senha, 12);
  this.senha = hash;
  next();
});

const Nutricionista = mongoose.model('Nutricionista', nutricionistaSchema);
module.exports = Nutricionista;