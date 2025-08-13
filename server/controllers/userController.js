const User = require('../models/userModel');
const Peso = require('../models/pesoModel');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const conquistasService = require('../services/conquistasService');

// --- Funções do Controller ---

exports.getMe = async (req, res) => {
    try {
        const usuario = await User.findById(req.userId).select('-password -fcmToken');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.onboarding = async (req, res) => {
    try {
        // ✅ 1. Adicionamos metaPeso aqui
        const { fezCirurgia, dataCirurgia, altura, pesoInicial, metaPeso } = req.body;

        if (!fezCirurgia || !altura || !pesoInicial || !metaPeso) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        const pesoNum = parseFloat(pesoInicial);
        const alturaNum = parseFloat(altura);
        const metaPesoNum = parseFloat(metaPeso);

        const detalhes = {
            fezCirurgia,
            dataCirurgia: (fezCirurgia === 'sim' || (fezCirurgia === 'nao' && dataCirurgia)) ? new Date(dataCirurgia) : null,
            altura: alturaNum,
            pesoInicial: pesoNum,
            pesoAtual: pesoNum
        };

        await User.findByIdAndUpdate(req.userId, {
            $set: {
                detalhesCirurgia: detalhes,
                onboardingCompleto: true,
                metaPeso: metaPesoNum // ✅ 2. Salvamos a meta de peso
            }
        });

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

exports.updateProfile = async (req, res) => {
    try {
        // ✅ 3. Adicionamos metaPeso aqui
        const { nome, sobrenome, whatsapp, detalhesCirurgia, metaPeso } = req.body;
        const updateData = {
            nome, sobrenome, whatsapp,
            'detalhesCirurgia.fezCirurgia': detalhesCirurgia.fezCirurgia,
            'detalhesCirurgia.dataCirurgia': detalhesCirurgia.dataCirurgia,
            'detalhesCirurgia.altura': detalhesCirurgia.altura,
            'detalhesCirurgia.pesoInicial': detalhesCirurgia.pesoInicial,
            metaPeso: metaPeso // ✅ 4. Adicionamos ao objeto de atualização
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

// ... (as outras funções como changePassword, saveFcmToken, etc. continuam iguais)

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
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        await User.findByIdAndUpdate(req.userId, { fcmToken: fcmToken });
        res.status(200).json({ message: 'Token salvo com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar token.' });
    }
};

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
        res.status(500).json({ message: "Erro geral no servidor." });
    }
};

exports.updateGoals = async (req, res) => {
    try {
        // Recebe todas as metas possíveis do corpo do pedido
        const { metaAguaDiaria, metaProteinaDiaria, metaCalorias, metaCarboidratos, metaGorduras } = req.body;

        const updateData = {};
        // Adiciona ao objeto de atualização apenas as metas que foram enviadas
        if (metaAguaDiaria) updateData.metaAguaDiaria = metaAguaDiaria;
        if (metaProteinaDiaria) updateData.metaProteinaDiaria = metaProteinaDiaria;
        if (metaCalorias) updateData.metaCalorias = metaCalorias;
        if (metaCarboidratos) updateData.metaCarboidratos = metaCarboidratos;
        if (metaGorduras) updateData.metaGorduras = metaGorduras;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Nenhuma meta fornecida para atualização." });
        }

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
        console.error("Erro ao atualizar metas:", error);
        res.status(500).json({ message: 'Erro ao atualizar as metas.' });
    }
};