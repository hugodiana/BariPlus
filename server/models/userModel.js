const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    sobrenome: { type: String },
    username: { type: String, unique: true, sparse: true }, // sparse: true permite valores nulos sem violar a regra de unicidade
    email: { type: String, unique: true, required: true },
    password: { type: String }, // Senha não é obrigatória no início por causa do fluxo da Kiwify
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
    kiwifySubscriptionId: String, // Para guardar a referência da compra na Kiwify
    conquistas: [{ type: String }],
    metaAguaDiaria: { type: Number, default: 2000 }, // Valor padrão de 2000ml
    metaProteinaDiaria: { type: Number, default: 60 }, // Valor padrão de 60g
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Simplificado, sem afiliados por agora
    fcmToken: String, // Para notificações push
    notificationSettings: {
        appointmentReminders: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true },
        weighInReminders: { type: Boolean, default: true }
    },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;