const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.register = async (req, res) => {
    // 2. Verificar se existem erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Se houver erros, retorna um status 400 com a lista de erros
        return res.status(400).json({ errors: errors.array() });
    }

    let novoUsuario;
    try {
        const { nome, sobrenome, username, email, password, whatsapp } = req.body;

        // A validação manual da senha foi removida, pois já foi feita pelo middleware.

        const existingUserEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserEmail) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        novoUsuario = new User({
            nome, sobrenome, username, 
            email: email.toLowerCase(),
            whatsapp, 
            password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 3600000), // 1 hora
        });
        await novoUsuario.save();

        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        
        const emailHtml = emailTemplate(
            'Ative a sua Conta no BariPlus',
            `Olá, ${nome}! Estamos muito felizes por ter você connosco. Por favor, clique no botão abaixo para ativar a sua conta e começar a sua jornada.`,
            'Ativar a Minha Conta',
            verificationLink
        );

        await resend.emails.send({
            from: `BariPlus <onboarding@resend.dev>`,
            to: [novoUsuario.email],
            subject: 'Ative a sua Conta no BariPlus',
            html: emailHtml,
        });
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso! Verifique seu e-mail.' });
    } catch (error) {
        console.error("Erro no registro:", error);
        if (novoUsuario?._id) await User.findByIdAndDelete(novoUsuario._id);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.login = asyncHandler(async (req, res) => {
    // O bloco try...catch foi REMOVIDO!
    const { identifier, password } = req.body;
    const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        res.status(401); // Apenas definimos o status
        throw new Error('Credenciais inválidas.'); // E lançamos um erro
    }
    if (!usuario.isEmailVerified) {
        res.status(403);
        throw new Error('Sua conta ainda não foi ativada. Por favor, verifique seu e-mail.');
    }
    
    const token = jwt.sign({ userId: usuario._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ 
        token, 
        user: {
            _id: usuario._id,
            nome: usuario.nome,
            email: usuario.email,
            isEmailVerified: usuario.isEmailVerified,
            pagamentoEfetuado: usuario.pagamentoEfetuado,
            onboardingCompleto: usuario.onboardingCompleto
        } 
    });
});


exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const usuario = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!usuario) {
            return res.status(400).json({ message: "Token inválido ou expirado." });
        }

        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();

        res.json({ message: "E-mail verificado com sucesso!" });
    } catch (error) { 
        console.error("Erro na verificação de email:", error);
        res.status(500).json({ message: "Erro no servidor durante a verificação." });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "O e-mail é obrigatório." });
        }

        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.json({ message: "Se uma conta com este e-mail existir, um novo link de verificação foi enviado." });
        }
        if (usuario.isEmailVerified) {
            return res.status(400).json({ message: "Este e-mail já foi verificado." });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        usuario.emailVerificationToken = verificationToken;
        usuario.emailVerificationExpires = new Date(Date.now() + 3600000); // 1 hora
        await usuario.save();
        
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        const emailHtml = emailTemplate(
            'Ative a sua Conta no BariPlus',
            `Olá, ${usuario.nome}! Aqui está o seu novo link para ativar a sua conta.`,
            'Ativar a Minha Conta',
            verificationLink
        );

        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [usuario.email],
            subject: 'Seu Novo Link de Verificação BariPlus',
            html: emailHtml,
        });

        res.json({ message: "Um novo link de verificação foi enviado para o seu e-mail." });
    } catch (error) {
        console.error("Erro ao reenviar verificação:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await User.findOne({ email });
        
        if (usuario) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            usuario.resetPasswordToken = resetToken;
            usuario.resetPasswordExpires = new Date(Date.now() + 3600000);
            await usuario.save();
            
            const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
            
            const emailHtml = emailTemplate(
                'Redefinição de Senha',
                'Recebemos um pedido para redefinir a sua senha. Se foi você, clique no botão abaixo. Se não foi você, pode ignorar este e-mail.',
                'Redefinir a Minha Senha',
                resetLink
            );

            await resend.emails.send({
                from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                to: [usuario.email],
                subject: "Redefinição de Senha - BariPlus",
                html: emailHtml,
            });
        }
        res.json({ message: "Se uma conta com este e-mail existir, um link de redefinição foi enviado." });
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ message: "Erro no servidor." });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        // 1. Verifica se houve erros de validação (do express-validator)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg }); // Envia a primeira mensagem de erro
        }

        const { token } = req.params;
        const { password } = req.body;
        
        // 2. A chamada antiga para 'validatePassword(password)' foi removida

        const usuario = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!usuario) {
            return res.status(400).json({ message: "Token inválido ou expirado." });
        }

        usuario.password = await bcrypt.hash(password, 10);
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();
        
        res.json({ message: "Senha redefinida com sucesso!" });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: "Erro ao redefinir senha." });
    }
};