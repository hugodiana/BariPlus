// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sobrenome: { type: String },
    
    // O campo 'username' já não é obrigatório ser único a nível da base de dados.
    // A lógica na rota de registo já garante que, quando um username é definido, ele é único.
    // A opção 'sparse: true' é mantida para otimizar as buscas.
    username: { type: String, unique: true, sparse: true }, 

    email: { type: String, unique: true, sparse: true }, // 'sparse' também é bom para o email
    password: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    onboardingCompleto: { type: Boolean, default: false },
    detalhesCirurgia: {
        fezCirurgia: String,
        dataCirurgia: Date,
        altura: Number,
        pesoInicial: Number,
        pesoAtual: Number
    },
    pagamentoEfetuado: { type: Boolean, default: false },
    kiwifySubscriptionId: String,
    conquistas: [{ type: String }],
    metaPeso: { type: Number, default: 0 },
    metaAguaDiaria: { type: Number, default: 2000 },
    metaProteinaDiaria: { type: Number, default: 60 },
    metaCalorias: { type: Number, default: 1200 },
    metaCarboidratos: { type: Number, default: 100 },
    metaGorduras: { type: Number, default: 40 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    fcmToken: String,
    notificationSettings: {
        appointmentReminders: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true },
        weighInReminders: { type: Boolean, default: true }
    },
    fotoPerfilUrl: { type: String, default: '' },
    nutricionistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nutricionista' },
    statusConta: {
        type: String,
        enum: ['ativo', 'pendente_prontuario'],
        default: 'ativo'
    }
}, { timestamps: true });

UserSchema.index({ createdAt: 1 });
UserSchema.index({ nutricionistaId: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;