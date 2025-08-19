// server/controllers/nutriController.js

const Nutricionista = require('../models/Nutricionista');
// --- CORREÇÃO ADICIONADA AQUI ---
// Importa o modelo 'User' para que possamos procurar os pacientes.
const User = require('../models/userModel');

// @desc    Obter dados do dashboard do nutricionista
// @route   GET /api/nutri/dashboard
// @access  Private (só para nutricionistas logados)
exports.getDashboardData = async (req, res) => {
  try {
    const nutricionista = await Nutricionista.findById(req.nutricionista.id).populate('pacientes', 'nome sobrenome');

    if (!nutricionista) {
      return res.status(404).json({ message: 'Nutricionista não encontrado.' });
    }

    const totalPacientes = nutricionista.pacientes.length;
    const vagasGratisRestantes = Math.max(0, nutricionista.limiteGratis - totalPacientes);
    const pacientesExtrasPagos = Math.max(0, totalPacientes - nutricionista.limiteGratis);

    res.status(200).json({
      totalPacientes,
      vagasGratisRestantes,
      pacientesExtrasPagos,
      pacientes: nutricionista.pacientes
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do nutricionista:", error);
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.' });
  }
};

// @desc    Nutricionista busca os detalhes de um paciente específico
// @route   GET /api/nutri/pacientes/:pacienteId
// @access  Private (Nutricionista)
exports.getPacienteDetails = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { pacienteId } = req.params;

        const nutricionista = await Nutricionista.findById(nutricionistaId);
        
        if (!nutricionista) {
            return res.status(404).json({ message: 'Nutricionista não encontrado.' });
        }

        const isMyPatient = nutricionista.pacientes.some(pId => pId.toString() === pacienteId);

        if (!isMyPatient) {
            return res.status(403).json({ message: 'Acesso negado. Este paciente não está na sua lista.' });
        }

        // Esta linha agora funciona porque o 'User' foi importado
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