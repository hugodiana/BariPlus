const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');

const resend = new Resend(process.env.RESEND_API_KEY);

const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>*]/.test(password)) return false;
    return true;
};

exports.register = async (req, res) => {
    let novoUsuario;
    try {
        const { nome, sobrenome, username, email, password, whatsapp } = req.body;

        if (!validatePassword(password)) {
            return res.status(400).json({ message: "A senha não cumpre os requisitos de segurança." });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        novoUsuario = new User({
            nome, sobrenome, username, email, whatsapp, password: hashedPassword,
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
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
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

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        if (!usuario.isEmailVerified) {
            return res.status(403).json({ message: 'Sua conta ainda não foi ativada. Por favor, verifique seu e-mail.' });
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
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

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
        const { token } = req.params;
        const { password } = req.body;
        if (!validatePassword(password)) {
            return res.status(400).json({ message: "A nova senha não cumpre os requisitos de segurança." });
        }
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