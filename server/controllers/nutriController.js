// server/controllers/nutriController.js

const Nutricionista = require('../models/Nutricionista');
const User = require('../models/User');
const Agendamento = require('../models/Agendamento');
const FoodLog = require('../models/FoodLog');
const Peso = require('../models/Peso');


// @desc    Obter dados do dashboard do nutricionista
// @route   GET /api/nutri/dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const [nutricionista, consultasDoDia] = await Promise.all([
      Nutricionista.findById(req.nutricionista.id)
        .populate('pacientes', 'nome sobrenome statusConta'), 
      Agendamento.find({
        nutricionistaId: req.nutricionista.id,
        start: { $gte: hojeInicio, $lt: hojeFim }
      }).sort({ start: 'asc' })
    ]);

    if (!nutricionista) {
      return res.status(404).json({ message: 'Nutricionista não encontrado.' });
    }
    
    const pacientesBariplus = nutricionista.pacientes.filter(p => p.statusConta === 'ativo');
    const pacientesLocais = nutricionista.pacientes.filter(p => p.statusConta === 'pendente_prontuario');

    const totalPacientes = nutricionista.pacientes.length;
    const vagasGratisRestantes = Math.max(0, nutricionista.limiteGratis - totalPacientes);
    const pacientesExtrasPagos = Math.max(0, totalPacientes - nutricionista.limiteGratis);

    res.status(200).json({
      totalPacientes,
      vagasGratisRestantes,
      pacientesExtrasPagos,
      pacientesBariplus: pacientesBariplus || [],
      pacientesLocais: pacientesLocais || [],
      consultasDoDia: consultasDoDia || []
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do nutricionista:", error);
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.' });
  }
};

// @desc    Nutricionista busca os detalhes de um paciente específico (BariPlus)
// @route   GET /api/nutri/pacientes/:pacienteId
exports.getPacienteDetails = async (req, res) => {
    try {
        const nutricionista = req.nutricionista; // Usa o objeto já populado do middleware
        const { pacienteId } = req.params;

        // ✅ CORREÇÃO: Verifica na nova lista unificada 'pacientes'
        const isMyPatient = nutricionista.pacientes.some(p => p._id.toString() === pacienteId && p.statusConta === 'ativo');

        if (!isMyPatient) {
            return res.status(403).json({ message: 'Acesso negado. Este paciente não está na sua lista ou não é um utilizador ativo do app.' });
        }

        const paciente = await User.findById(pacienteId).select('-password');
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }

        res.status(200).json(paciente);
    } catch (error) {
        console.error("Erro ao buscar detalhes do paciente:", error);
        res.status(500).json({ message: 'Erro no servidor ao buscar detalhes do paciente.' });
    }
};


// @desc    Obter atividade recente dos pacientes do nutricionista
// @route   GET /api/nutri/recent-activity
exports.getRecentActivity = async (req, res) => {
    try {
        const nutricionista = req.nutricionista; // Usa o objeto já populado do middleware
        
        // ✅ CORREÇÃO: Usa a nova lista 'pacientes' e filtra apenas os que usam o app (status 'ativo')
        const activePatientIds = nutricionista.pacientes
            .filter(p => p.statusConta === 'ativo')
            .map(p => p._id);

        if (!nutricionista || activePatientIds.length === 0) {
            return res.json([]);
        }

        const recentPesos = await Peso.aggregate([
            { $match: { userId: { $in: activePatientIds } } },
            { $unwind: '$registros' },
            { $sort: { 'registros.data': -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'pacienteInfo' } },
            { $project: {
                _id: '$registros._id',
                tipo: 'peso',
                pacienteNome: { $arrayElemAt: ['$pacienteInfo.nome', 0] },
                valor: '$registros.peso',
                data: '$registros.data'
            }}
        ]);

        const recentFoodLogs = await FoodLog.aggregate([
            { $match: { userId: { $in: activePatientIds } } },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'pacienteInfo' } },
            { $project: {
                _id: '$_id',
                tipo: 'diario',
                pacienteNome: { $arrayElemAt: ['$pacienteInfo.nome', 0] },
                data: '$updatedAt'
            }}
        ]);
        
        const allActivities = [...recentPesos, ...recentFoodLogs];
        allActivities.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        res.json(allActivities.slice(0, 5));

    } catch (error) {
        console.error("Erro ao buscar atividades recentes:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};