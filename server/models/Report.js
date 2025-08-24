const mongoose = require('mongoose');
const crypto = require('crypto');

const ReportSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Token único e não adivinhável para aceder ao relatório
    token: { 
        type: String, 
        required: true, 
        unique: true, 
        default: () => crypto.randomBytes(32).toString('hex') 
    },
    type: {
        type: String,
        required: true,
        enum: ['progresso', 'exames'] // Tipos de relatório que podemos ter
    },
    // Guarda os dados no momento da criação para que o relatório seja um "instantâneo"
    dataSnapshot: { 
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    // Guarda o nome do utilizador no momento da criação
    userNameSnapshot: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        // O link expira em 30 dias para segurança
        default: () => new Date(Date.now() + 30*24*60*60*1000), 
    }
}, { timestamps: true });

ReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Limpa automaticamente os relatórios expirados
ReportSchema.index({ userId: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdAt: 1 });

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;