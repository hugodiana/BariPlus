// server/controllers/nutriController.js
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');

exports.getDashboardData = async (req, res) => {
  try {
    const nutricionista = await Nutricionista.findById(req.nutricionista.id)
      .populate('pacientesBariplus', 'nome sobrenome')
      .populate('pacientesLocais', 'nomeCompleto');

    if (!nutricionista) {
      return res.status(404).json({ message: 'Nutricionista não encontrado.' });
    }

    const totalPacientes = (nutricionista.pacientesBariplus?.length || 0) + (nutricionista.pacientesLocais?.length || 0);
    const vagasGratisRestantes = Math.max(0, nutricionista.limiteGratis - totalPacientes);
    const pacientesExtrasPagos = Math.max(0, totalPacientes - nutricionista.limiteGratis);

    res.status(200).json({
      totalPacientes,
      vagasGratisRestantes,
      pacientesExtrasPagos,
      pacientes: nutricionista.pacientesBariplus || [],
      pacientesLocais: nutricionista.pacientesLocais || []
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do nutricionista:", error);
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.' });
  }
};

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