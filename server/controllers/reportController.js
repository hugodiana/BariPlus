const Report = require('../models/reportModel');
const Peso = require('../models/pesoModel');
const Exams = require('../models/examsModel');
const User = require('../models/userModel');

// POST /api/reports/generate - Cria um novo link partilhável
exports.generateShareableReport = async (req, res) => {
    try {
        const { type } = req.body;
        const userId = req.userId;

        let dataSnapshot;
        const usuario = await User.findById(userId);
        const userNameSnapshot = `${usuario.nome} ${usuario.sobrenome || ''}`.trim();

        if (type === 'progresso') {
            const pesoDoc = await Peso.findOne({ userId });
            dataSnapshot = pesoDoc ? pesoDoc.registros : [];
        } else if (type === 'exames') {
            const examsDoc = await Exams.findOne({ userId });
            dataSnapshot = examsDoc ? examsDoc.examEntries : [];
        } else {
            return res.status(400).json({ message: 'Tipo de relatório inválido.' });
        }

        const newReport = new Report({
            userId,
            type,
            dataSnapshot,
            userNameSnapshot
        });

        await newReport.save();

        res.status(201).json({ 
            message: 'Link de relatório gerado com sucesso!',
            token: newReport.token,
            shareableLink: `${process.env.CLIENT_URL}/relatorio/${newReport.token}`
        });

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        res.status(500).json({ message: 'Erro no servidor ao gerar o relatório.' });
    }
};

// GET /api/public/report/:token - Rota pública para buscar dados de um relatório
exports.getPublicReport = async (req, res) => {
    try {
        const { token } = req.params;

        // Procura um relatório que não tenha expirado
        const report = await Report.findOne({ 
            token: token,
            expiresAt: { $gt: new Date() } 
        });

        if (!report) {
            return res.status(404).json({ message: 'Relatório não encontrado ou expirado.' });
        }

        res.json({
            type: report.type,
            data: report.dataSnapshot,
            userName: report.userNameSnapshot,
            createdAt: report.createdAt
        });

    } catch (error) {
        console.error("Erro ao buscar relatório público:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};