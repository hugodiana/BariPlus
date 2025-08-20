const User = require('../models/userModel');
const Nutricionista = require('../models/Nutricionista');
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
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Agrega os dados em paralelo para mais performance
        const [
            totalUsers,
            paidUsers,
            newUsersLast7Days,
            totalNutris,
            activeNutris
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ pagamentoEfetuado: true }),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Nutricionista.countDocuments(),
            Nutricionista.countDocuments({ 'assinatura.status': 'ativa' })
        ]);

        res.json({ 
            totalUsers, 
            paidUsers, 
            newUsersLast7Days,
            totalNutris,
            activeNutris
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ message: "Erro no servidor ao buscar estatísticas." });
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

// GET /api/admin/nutricionistas - Listar todos os nutricionistas
// GET /api/admin/nutricionistas - Listar todos os nutricionistas com paginação e busca
exports.listNutricionistas = async (req, res) => {
    try {
        const { page = 1, limit = 15, search = '' } = req.query;
        const skip = (page - 1) * limit;
        const query = search 
            ? { $or: [
                    { nome: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { crn: { $regex: search, $options: 'i' } }
                ]} 
            : {};

        const [nutricionistas, total] = await Promise.all([
            Nutricionista.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
            Nutricionista.countDocuments(query)
        ]);

        res.json({
            nutricionistas,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar nutricionistas.' });
    }
};

// GET /api/admin/nutricionistas/:id - Obter detalhes de um nutricionista
exports.getNutricionistaById = async (req, res) => {
    try {
        const nutricionista = await Nutricionista.findById(req.params.id)
            .populate('pacientesBariplus', 'nome sobrenome')
            .populate('pacientesLocais', 'nomeCompleto');
        if (!nutricionista) return res.status(404).json({ message: 'Nutricionista não encontrado.' });
        res.json(nutricionista);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes do nutricionista.' });
    }
};

// PUT /api/admin/nutricionistas/:id - Atualizar dados de um nutricionista (ex: bloquear)
exports.updateNutricionista = async (req, res) => {
    try {
        const nutricionista = await Nutricionista.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!nutricionista) return res.status(404).json({ message: 'Nutricionista não encontrado.' });
        res.json(nutricionista);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar nutricionista.' });
    }
};

// GET /api/admin/users/:id - Obter detalhes de um paciente
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('nutricionistaId', 'nome crn'); // Popula com os dados do nutri, se houver

        if (!user) return res.status(404).json({ message: 'Paciente não encontrado.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes do paciente.' });
    }
};

// @desc    Obter estatísticas de crescimento
// @route   GET /api/admin/growth-stats
exports.getGrowthStats = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const aggregatePipeline = (model) => ([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const [userGrowth, nutriGrowth] = await Promise.all([
            User.aggregate(aggregatePipeline(User)),
            Nutricionista.aggregate(aggregatePipeline(Nutricionista))
        ]);

        res.json({ userGrowth, nutriGrowth });
    } catch (error) {
        console.error("Erro ao buscar estatísticas de crescimento:", error);
        res.status(500).json({ message: "Erro no servidor." });
    }
};