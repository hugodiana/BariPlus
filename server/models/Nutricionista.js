// server/models/Nutricionista.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ✅ ETAPA 1: Definir o schema do Alimento Personalizado PRIMEIRO.
const AlimentoPersonalizadoSchema = new mongoose.Schema({
    description: { type: String, required: true },
    kcal: { type: Number, required: true, default: 0 },
    protein: { type: Number, required: true, default: 0 },
    carbohydrates: { type: Number, required: true, default: 0 },
    lipids: { type: Number, required: true, default: 0 },
}, { _id: true });


// ✅ ETAPA 2: Agora, definir o schema do Nutricionista, que pode usar o schema acima sem erro.
const nutricionistaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true, select: false },
  crn: { type: String, required: true, unique: true },
  especializacao: { type: String },
  clinica: { type: String },
  
  pacientes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],

  // Agora esta linha funciona, porque AlimentoPersonalizadoSchema já existe.
  alimentosPersonalizados: [AlimentoPersonalizadoSchema],

  limiteGratis: { type: Number, default: 10 },
  assinatura: {
      id: String,
      status: { type: String, default: 'inativa' }
  },
}, { timestamps: true });

nutricionistaSchema.index({ pacientes: 1 });
nutricionistaSchema.index({ 'assinatura.status': 1 });
nutricionistaSchema.index({ createdAt: 1 });

// A sua função de hash da senha (removi a duplicada)
nutricionistaSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  const hash = await bcrypt.hash(this.senha, 12);
  this.senha = hash;
  next();
});

const Nutricionista = mongoose.model('Nutricionista', nutricionistaSchema);
module.exports = Nutricionista;