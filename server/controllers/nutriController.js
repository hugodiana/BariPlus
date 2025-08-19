// server/controllers/nutriController.js

const Nutricionista = require('../models/Nutricionista');

// @desc    Obter dados do dashboard do nutricionista
// @route   GET /api/nutri/dashboard
// @access  Private (só для nutricionistas logados)
exports.getDashboardData = async (req, res) => {
  try {
    // O ID do nutricionista logado é adicionado ao `req` pelo middleware `protectNutri`
    const nutricionista = await Nutricionista.findById(req.nutricionista.id).populate('pacientes', 'nome sobrenome');

    if (!nutricionista) {
      return res.status(404).json({ message: 'Nutricionista não encontrado.' });
    }

    const totalPacientes = nutricionista.pacientes.length;
    // Lógica de vagas (pode ser expandida no futuro)
    const vagasGratisRestantes = Math.max(0, nutricionista.limiteGratis - totalPacientes);
    const pacientesExtrasPagos = Math.max(0, totalPacientes - nutricionista.limiteGratis);

    res.status(200).json({
      totalPacientes,
      vagasGratisRestantes,
      pacientesExtrasPagos,
      // Futuramente, podemos adicionar mais dados aqui, como alertas ou pacientes recentes
      pacientesRecentes: nutricionista.pacientes.slice(-5).reverse() // Exemplo: 5 pacientes mais recentes
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do nutricionista:", error);
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.', error: error.message });
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
        
        // Verifica se o ID do paciente está na lista de pacientes do nutricionista
        const isMyPatient = nutricionista.pacientes.some(pId => pId.toString() === pacienteId);

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