const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const conquistasService = require('../services/conquistasService');

// --- Funções do Controller ---

// GET /api/me - Buscar dados do usuário logado
exports.getMe = async (req, res) => {
    try {
        const usuario = await User.findById(req.userId).select('-password -fcmToken');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// POST /api/onboarding - Processar dados do onboarding
exports.onboarding = async (req, res) => {
    try {
        const { fezCirurgia, dataCirurgia, altura, pesoInicial } = req.body;

        if (!fezCirurgia || !altura || !pesoInicial) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        const pesoNum = parseFloat(pesoInicial);
        const alturaNum = parseFloat(altura);

        const detalhes = {
            fezCirurgia,
            dataCirurgia: fezCirurgia === 'sim' ? new Date(dataCirurgia) : null,
            altura: alturaNum,
            pesoInicial: pesoNum,
            pesoAtual: pesoNum
        };

        await User.findByIdAndUpdate(req.userId, {
            $set: {
                detalhesCirurgia: detalhes,
                onboardingCompleto: true
            }
        });

        // Adiciona o primeiro registro de peso
        await Peso.findOneAndUpdate(
            { userId: req.userId },
            { $push: { registros: { peso: pesoNum, data: new Date() } } },
            { upsert: true }
        );

        await conquistasService.verificarConquistas(req.userId);

        res.status(200).json({ message: 'Dados salvos com sucesso!' });
    } catch (error) {
        console.error('Erro no onboarding:', error);
        res.status(500).json({ message: 'Erro ao salvar detalhes.' });
    }
};

// PUT /api/user/profile - Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
    try {
        const { nome, sobrenome, whatsapp, detalhesCirurgia } = req.body;
        const updateData = {
            nome, sobrenome, whatsapp,
            'detalhesCirurgia.fezCirurgia': detalhesCirurgia.fezCirurgia,
            'detalhesCirurgia.dataCirurgia': detalhesCirurgia.dataCirurgia,
            'detalhesCirurgia.altura': detalhesCirurgia.altura,
            'detalhesCirurgia.pesoInicial': detalhesCirurgia.pesoInicial,
        };

        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!usuarioAtualizado) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.json(usuarioAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).json({ message: 'Erro ao atualizar o perfil.' });
    }
};

// PUT /api/user/change-password - Mudar a senha
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const usuario = await User.findById(req.userId);
        if (!usuario) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        const isMatch = await bcrypt.compare(currentPassword, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ message: "A senha atual está incorreta." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedNewPassword;
        await usuario.save();
        res.json({ message: "Senha alterada com sucesso!" });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

exports.updateSurgeryDate = async (req, res) => {
    try {
        const { dataCirurgia } = req.body;
        if (!dataCirurgia) {
            return res.status(400).json({ message: 'A data da cirurgia é obrigatória.' });
        }
        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.userId,
            { $set: { "detalhesCirurgia.dataCirurgia": new Date(dataCirurgia) } },
            { new: true }
        ).select('-password');
        if (!usuarioAtualizado) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(usuarioAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar data de cirurgia:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// ✅ NOVO: Salvar o token de notificação (FCM)
exports.saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        await User.findByIdAndUpdate(req.userId, { fcmToken: fcmToken });
        res.status(200).json({ message: 'Token salvo com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar token.' });
    }
};

// ✅ NOVO: Enviar notificação de teste
exports.sendTestNotification = async (req, res) => {
    try {
        const usuario = await User.findById(req.userId);
        if (usuario && usuario.fcmToken) {
            const message = {
                notification: {
                    title: 'Olá do BariPlus! 👋',
                    body: 'Este é o seu teste de notificação. Funcionou!'
                },
                token: usuario.fcmToken
            };
            await admin.messaging().send(message);
            res.status(200).json({ message: "Notificação de teste enviada com sucesso!" });
        } else {
            res.status(404).json({ message: "Token de notificação não encontrado para este usuário." });
        }
    } catch (error) {
        console.error("Erro ao enviar notificação de teste:", error);
        res.status(500).json({ message: "Erro geral no servidor." });
    }
};