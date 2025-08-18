// server/controllers/planoAlimentarController.js

const PlanoAlimentar = require('../models/PlanoAlimentar');
const Nutricionista = require('../models/Nutricionista');

// @desc    Nutricionista cria um novo plano alimentar para um paciente
// @route   POST /api/nutri/planos/criar
// @access  Private (Nutricionista)
exports.criarPlanoAlimentar = async (req, res) => {
  const nutricionistaId = req.nutricionista.id;
  const { pacienteId, titulo, refeicoes, observacoesGerais } = req.body;

  if (!pacienteId || !titulo || !refeicoes || refeicoes.length === 0) {
    return res.status(400).json({ message: 'Dados insuficientes para criar o plano.' });
  }

  try {
    const nutri = await Nutricionista.findById(nutricionistaId);
    const isMyPatient = nutri.pacientes.some(pId => pId.toString() === pacienteId);

    if (!isMyPatient) {
      return res.status(403).json({ message: 'Acesso negado. Este paciente não está vinculado a você.' });
    }

    // Desativa planos antigos do mesmo paciente
    await PlanoAlimentar.updateMany(
      { pacienteId: pacienteId },
      { $set: { ativo: false } }
    );

    const novoPlano = await PlanoAlimentar.create({
      nutricionistaId,
      pacienteId,
      titulo,
      refeicoes,
      observacoesGerais
    });

    res.status(201).json({ message: 'Plano alimentar criado com sucesso!', plano: novoPlano });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao criar plano alimentar.', error: error.message });
  }
};

// @desc    Nutricionista busca todos os planos de um paciente específico
// @route   GET /api/nutri/pacientes/:pacienteId/planos
// @access  Private (Nutricionista)
exports.getPlanosPorPaciente = async (req, res) => {
    const nutricionistaId = req.nutricionista.id;
    const { pacienteId } = req.params;

    try {
        const nutri = await Nutricionista.findById(nutricionistaId);
        if (!nutri.pacientes.some(pId => pId.toString() === pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const planos = await PlanoAlimentar.find({ pacienteId }).sort({ createdAt: -1 });
        res.status(200).json(planos);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos do paciente.', error: error.message });
    }
};