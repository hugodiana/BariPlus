const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sobrenome: { type: String },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, required: true },
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
    // ✅ NOVOS CAMPOS AQUI
    metaPeso: { type: Number, default: 0 },
    metaAguaDiaria: { type: Number, default: 2000 },
    metaProteinaDiaria: { type: Number, default: 60 },
    metaCalorias: { type: Number, default: 1200 },
    metaCarboidratos: { type: Number, default: 100 },
    metaGorduras: { type: Number, default: 40 },
    // FIM DOS NOVOS CAMPOS
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    fcmToken: String,
    notificationSettings: {
        appointmentReminders: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true },
        weighInReminders: { type: Boolean, default: true }
    },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;