const User = require('../models/userModel');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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

// ✅ NOVA FUNÇÃO: Revogar o acesso de um usuário
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

// ✅ NOVA FUNÇÃO: Confirmar manualmente o e-mail de um usuário
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