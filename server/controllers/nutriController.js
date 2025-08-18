// server/controllers/nutriController.js

const Nutricionista = require('../models/Nutricionista');

// @desc    Obter dados do dashboard do nutricionista
// @route   GET /api/nutri/dashboard
// @access  Private (só para nutricionistas logados)
exports.getDashboardData = async (req, res) => {
  try {
    // O ID do nutricionista logado é adicionado ao `req` pelo middleware `protectNutri`
    const nutricionista = await Nutricionista.findById(req.nutricionista.id).populate('pacientes');

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
      // Futuramente, podemos adicionar mais dados aqui, como alertas ou pacientes recentes
      pacientesRecentes: nutricionista.pacientes.slice(0, 5) // Exemplo: 5 pacientes mais recentes
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao buscar dados do dashboard.', error: error.message });
  }
};