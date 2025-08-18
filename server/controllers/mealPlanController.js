// server/controllers/mealPlanController.js

const PlanoAlimentar = require('../models/PlanoAlimentar');

// @desc    Paciente busca o seu plano alimentar ativo
// @route   GET /api/meal-plan/my-plan
// @access  Private (Paciente)
exports.getMyActivePlan = async (req, res) => {
    try {
        // O req.userId vem do middleware de autenticação do paciente
        const plano = await PlanoAlimentar.findOne({
            pacienteId: req.userId,
            ativo: true
        }).populate('nutricionistaId', 'nome crn'); // Popula com alguns dados do nutri

        if (!plano) {
            return res.status(404).json({ message: 'Nenhum plano alimentar ativo encontrado.' });
        }

        res.status(200).json(plano);
    } catch (error) {
        console.error("Erro ao buscar plano alimentar do paciente:", error);
        res.status(500).json({ message: 'Erro no servidor ao buscar o plano alimentar.' });
    }
};