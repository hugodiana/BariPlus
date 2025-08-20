// server/controllers/planoAlimentarController.js

const PlanoAlimentar = require('../models/PlanoAlimentar');
const Nutricionista = require('../models/Nutricionista');

// @desc    Nutricionista cria um novo plano alimentar para um paciente
// @route   POST /api/nutri/planos/criar
exports.criarPlanoAlimentar = async (req, res) => {
  const nutricionistaId = req.nutricionista.id;
  const { pacienteId, titulo, refeicoes, observacoesGerais } = req.body;

  if (!pacienteId || !titulo || !refeicoes || refeicoes.length === 0) {
    return res.status(400).json({ message: 'Dados insuficientes para criar o plano.' });
  }

  try {
    const nutri = await Nutricionista.findById(nutricionistaId);
    // CORREÇÃO: Verifica na lista correta 'pacientesBariplus'
    const isMyPatient = nutri.pacientesBariplus.some(pId => pId.toString() === pacienteId);

    if (!isMyPatient) {
      return res.status(403).json({ message: 'Acesso negado. Este paciente não está vinculado a você.' });
    }

    await PlanoAlimentar.updateMany({ pacienteId: pacienteId }, { $set: { ativo: false } });
    const novoPlano = await PlanoAlimentar.create({ nutricionistaId, pacienteId, titulo, refeicoes, observacoesGerais });
    res.status(201).json({ message: 'Plano alimentar criado com sucesso!', plano: novoPlano });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao criar plano alimentar.', error: error.message });
  }
};

// @desc    Nutricionista busca todos os planos de um paciente específico
// @route   GET /api/nutri/pacientes/:pacienteId/planos
exports.getPlanosPorPaciente = async (req, res) => {
    const nutricionistaId = req.nutricionista.id;
    const { pacienteId } = req.params;

    try {
        const nutri = await Nutricionista.findById(nutricionistaId);
        // CORREÇÃO: Verifica na lista correta 'pacientesBariplus'
        if (!nutri.pacientesBariplus.some(pId => pId.toString() === pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const planos = await PlanoAlimentar.find({ pacienteId }).sort({ createdAt: -1 });
        res.status(200).json(planos);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar planos do paciente.', error: error.message });
    }
};

// @desc    Nutricionista busca um plano alimentar específico pelo ID
// @route   GET /api/nutri/planos/:planoId
// @access  Private (Nutricionista)
exports.getPlanoById = async (req, res) => {
    try {
        const { planoId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        const plano = await PlanoAlimentar.findById(planoId);

        if (!plano) {
            return res.status(404).json({ message: 'Plano alimentar não encontrado.' });
        }

        if (plano.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        res.status(200).json(plano);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar o plano alimentar.' });
    }
};

// --- FUNÇÕES DE TEMPLATE QUE ESTAVAM EM FALTA ---

// @desc    Salvar um plano como um template
// @route   POST /api/nutri/planos/:planoId/salvar-como-template
exports.saveAsTemplate = async (req, res) => {
    try {
        const { planoId } = req.params;
        const { templateName } = req.body;
        const nutricionistaId = req.nutricionista.id;

        if (!templateName) {
            return res.status(400).json({ message: 'O nome do template é obrigatório.' });
        }

        const planoOriginal = await PlanoAlimentar.findById(planoId);
        if (!planoOriginal || planoOriginal.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(404).json({ message: 'Plano original não encontrado ou acesso negado.' });
        }

        const novoTemplate = new PlanoAlimentar({
            nutricionistaId,
            titulo: planoOriginal.titulo,
            refeicoes: planoOriginal.refeicoes,
            observacoesGerais: planoOriginal.observacoesGerais,
            isTemplate: true,
            templateName: templateName,
            pacienteId: null,
            ativo: false,
        });

        await novoTemplate.save();
        res.status(201).json({ message: 'Plano salvo como template com sucesso!', template: novoTemplate });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar o template.' });
    }
};

// @desc    Listar todos os templates de um nutricionista
// @route   GET /api/nutri/planos/templates
exports.getTemplates = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const templates = await PlanoAlimentar.find({ nutricionistaId, isTemplate: true });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os templates.' });
    }
};