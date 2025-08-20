// server/controllers/nutriController.js

const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');
const Agendamento = require('../models/Agendamento');
const FoodLog = require('../models/foodLogModel');
const Peso = require('../models/pesoModel');

// @desc    Obter dados do dashboard do nutricionista
// @route   GET /api/nutri/dashboard
// @access  Private (só para nutricionistas logados)
exports.getDashboardData = async (req, res) => {
  try {
    // ✅ 2. DEFINIR O INÍCIO E O FIM DO DIA ATUAL
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    // ✅ 3. BUSCAR OS DADOS EM PARALELO (MAIS EFICIENTE)
    const [nutricionista, consultasDoDia] = await Promise.all([
      Nutricionista.findById(req.nutricionista.id)
        .populate('pacientesBariplus', 'nome sobrenome')
        .populate('pacientesLocais', 'nomeCompleto'),
      Agendamento.find({
        nutricionistaId: req.nutricionista.id,
        start: {
          $gte: hojeInicio,
          $lt: hojeFim
        }
      }).sort({ start: 'asc' }) // Ordena as consultas pela hora de início
    ]);


    if (!nutricionista) {
      return res.status(404).json({ message: 'Nutricionista não encontrado.' });
    }

    const totalPacientes = (nutricionista.pacientesBariplus?.length || 0) + (nutricionista.pacientesLocais?.length || 0);
    const vagasGratisRestantes = Math.max(0, nutricionista.limiteGratis - totalPacientes);
    const pacientesExtrasPagos = Math.max(0, totalPacientes - nutricionista.limiteGratis);

    // ✅ 4. ADICIONAR AS CONSULTAS DO DIA À RESPOSTA DA API
    res.status(200).json({
      totalPacientes,
      vagasGratisRestantes,
      pacientesExtrasPagos,
      pacientesBariplus: nutricionista.pacientesBariplus || [],
      pacientesLocais: nutricionista.pacientesLocais || [],
      consultasDoDia: consultasDoDia || []
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do nutricionista:", error);
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.' });
  }
};

// @desc    Nutricionista busca os detalhes de um paciente específico (BariPlus)
// @route   GET /api/nutri/pacientes/:pacienteId
// @access  Private (Nutricionista)
exports.getPacienteDetails = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { pacienteId } = req.params;

        const nutricionista = await Nutricionista.findById(nutricionistaId);
        
        const isMyPatient = nutricionista.pacientesBariplus.some(pId => pId.toString() === pacienteId);

        if (!isMyPatient) {
            return res.status(403).json({ message: 'Acesso negado. Este paciente não está na sua lista.' });
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
// @access  Private (Nutricionista)
exports.getRecentActivity = async (req, res) => {
    try {
        const nutricionista = await Nutricionista.findById(req.nutricionista.id).select('pacientesBariplus');
        if (!nutricionista || nutricionista.pacientesBariplus.length === 0) {
            return res.json([]);
        }

        const patientIds = nutricionista.pacientesBariplus;

        // Buscar os últimos 5 registos de peso
        const recentPesos = await Peso.aggregate([
            { $match: { userId: { $in: patientIds } } },
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

        // Buscar os últimos 5 diários alimentares preenchidos
        const recentFoodLogs = await FoodLog.aggregate([
            { $match: { userId: { $in: patientIds } } },
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
        
        // Juntar, ordenar e limitar os resultados
        const allActivities = [...recentPesos, ...recentFoodLogs];
        allActivities.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        res.json(allActivities.slice(0, 5)); // Retorna as 5 atividades mais recentes no total

    } catch (error) {
        console.error("Erro ao buscar atividades recentes:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};