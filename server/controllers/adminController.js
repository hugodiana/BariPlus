const User = require('../models/userModel');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin'); // ✅ IMPORTAÇÃO ADICIONADA AQUI

exports.loginAdmin = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const usuario = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (usuario.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Esta área é exclusiva para administradores.' });
        }

        const token = jwt.sign({ userId: usuario._id, role: usuario.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        console.error("Erro no login de admin:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

// GET /api/admin/users - Listar todos os usuários com paginação
exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 15, search = '' } = req.query;
        const skip = (page - 1) * limit;
        const query = search 
            ? { $or: [
                    { nome: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]} 
            : {};

        const [users, total] = await Promise.all([
            User.find(query).select('-password -fcmToken').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        res.json({
            users,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários.' });
    }
};

// POST /api/admin/grant-access/:userId - Conceder acesso pago a um usuário
exports.grantAccess = async (req, res) => {
    try {
        const { userId } = req.params;
        const usuario = await User.findByIdAndUpdate(userId, { $set: { pagamentoEfetuado: true } }, { new: true }).select('-password');
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
        res.json({ message: "Acesso concedido com sucesso.", usuario });
    } catch (error) {
        res.status(500).json({ message: "Erro ao conceder acesso." });
    }
};

// POST /api/admin/users/:userId/revoke-access - Revogar o acesso de um usuário
exports.revokeAccess = async (req, res) => {
    try {
        const { userId } = req.params;
        const usuario = await User.findByIdAndUpdate(userId, { $set: { pagamentoEfetuado: false } }, { new: true }).select('-password');
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
        res.json({ message: "Acesso revogado com sucesso.", usuario });
    } catch (error) {
        res.status(500).json({ message: "Erro ao revogar acesso." });
    }
};

// POST /api/admin/users/:userId/verify-email - Confirmar manualmente o e-mail de um usuário
exports.verifyUserEmail = async (req, res) => {
    try {
        const { userId } = req.params;
        const usuario = await User.findByIdAndUpdate(userId, { $set: { isEmailVerified: true } }, { new: true }).select('-password');
        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });
        res.json({ message: "E-mail do usuário verificado com sucesso.", usuario });
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar e-mail." });
    }
};

// GET /api/admin/stats - Obter estatísticas do painel
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({ pagamentoEfetuado: true });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        res.json({ totalUsers, paidUsers, newUsersLast7Days });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor" });
    }
};

// POST /api/admin/notifications/broadcast - Enviar notificação em massa
exports.sendBroadcastNotification = async (req, res) => {
    try {
        const { title, body, link } = req.body;

        if (!title || !body) {
            return res.status(400).json({ message: 'Título e corpo da mensagem são obrigatórios.' });
        }

        const usersWithTokens = await User.find({ fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
        
        if (usersWithTokens.length === 0) {
            return res.status(404).json({ message: 'Nenhum usuário apto a receber notificações foi encontrado.' });
        }

        const tokens = usersWithTokens.map(user => user.fcmToken);

        // A mensagem agora está dentro de um objeto 'multicast'
        const message = {
            notification: {
                title: title,
                body: body,
            },
            webpush: {
                fcmOptions: {
                    link: link || 'https://bariplus.vercel.app'
                },
                notification: {
                    icon: 'https://bariplus.vercel.app/bariplus_logo.png' 
                }
            },
            tokens: tokens,
        };

        // ✅ CORREÇÃO: A função foi alterada de sendMulticast para sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast(message);

        res.status(200).json({
            message: 'Notificações enviadas com sucesso!',
            successCount: response.successCount,
            failureCount: response.failureCount,
        });

    } catch (error) {
        console.error('Erro ao enviar notificações em massa:', error);
        res.status(500).json({ message: 'Erro no servidor ao tentar enviar notificações.' });
    }
};