const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const validatePassword = (password) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>*]/.test(password)) return false;
    return true;
};

// --- Funções do Controller ---

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
        
        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [novoUsuario.email],
            subject: 'Ative a sua Conta no BariPlus',
            html: `<h1>Bem-vindo(a)!</h1><p>Clique no link para ativar sua conta:</p><a href="${verificationLink}">Ativar Conta</a>`,
        });
        
        // criarDocumentosPadrao(novoUsuario._id); // Lembre-se de implementar esta função

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
            return res.status(403).json({ message: 'Sua conta ainda não foi ativada.' });
        }
        
        // ✅ GERA OS DOIS TOKENS
        const accessToken = jwt.sign(
            { userId: usuario._id, role: usuario.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' } // Vida curta
        );
        const refreshToken = jwt.sign(
            { userId: usuario._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // Vida longa
        );

        // Guarda o refresh token no usuário
        usuario.refreshToken = refreshToken;
        await usuario.save();

        // Envia o refresh token num cookie httpOnly (mais seguro)
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
        });

        // Envia o access token no corpo da resposta
        res.json({ accessToken });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// ✅ NOVA FUNÇÃO PARA ATUALIZAR O TOKEN
exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.jwt;
    if (!refreshToken) return res.sendStatus(401);

    try {
        const usuario = await User.findOne({ refreshToken });
        if (!usuario) return res.sendStatus(403);

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || usuario._id.toString() !== decoded.userId) {
                return res.sendStatus(403);
            }
            const accessToken = jwt.sign(
                { userId: usuario._id, role: usuario.role },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );
            res.json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor." });
    }
};

// ✅ NOVA FUNÇÃO PARA LOGOUT SEGURO
exports.logout = async (req, res) => {
    const refreshToken = req.cookies?.jwt;
    if (!refreshToken) return res.sendStatus(204);

    try {
        await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    } catch (error) {
        // Ignora o erro, o importante é limpar o cookie
    }
    
    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.sendStatus(204);
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const usuario = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });
        if (!usuario) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_token`);
        }
        usuario.isEmailVerified = true;
        usuario.emailVerificationToken = undefined;
        usuario.emailVerificationExpires = undefined;
        await usuario.save();
        res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
    } catch (error) { 
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
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
            await resend.emails.send({
                from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
                to: [usuario.email],
                subject: "Redefinição de Senha - BariPlus",
                html: `<p>Para redefinir sua senha, clique no link:</p><a href="${resetLink}">Redefinir Senha</a>`,
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