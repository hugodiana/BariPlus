const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const nutricionistaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true, select: false }, // `select: false` para não vir por padrão nas buscas
  crn: { type: String, required: true, unique: true },
  especializacao: { type: String },
  clinica: { type: String },
  pacientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente'
  }],
  limiteGratis: { type: Number, default: 10 },
  assinatura: {
      id: String, // ID da assinatura no Mercado Pago/Kiwify
      status: { type: String, default: 'inativa' } // ex: ativa, inativa, cancelada
  },
  createdAt: { type: Date, default: Date.now }
});

// Criptografar a senha antes de salvar o nutricionista
nutricionistaSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  const hash = await bcrypt.hash(this.senha, 12);
  this.senha = hash;
  next();
});

const Nutricionista = mongoose.model('Nutricionista', nutricionistaSchema);
module.exports = Nutricionista;