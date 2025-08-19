// server/controllers/conviteController.js

const Convite = require('../models/conviteModel');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');

// @desc    Nutricionista gera um novo convite
// @route   POST /api/nutri/convites/gerar
// @access  Private (Nutricionista)
exports.gerarConvite = async (req, res) => {
  try {
    const nutricionistaId = req.nutricionista.id;
    const convite = await Convite.create({ nutricionistaId });
    const urlConvite = `${process.env.CLIENT_URL}/convite/${convite.codigo}`;

    res.status(201).json({
      message: 'Convite gerado com sucesso!',
      codigo: convite.codigo,
      url: urlConvite,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar convite.', error: error.message });
  }
};

// @desc    Paciente obtém informações de um convite pelo código
// @route   GET /api/convites/:codigo
// @access  Public
exports.getConviteInfo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const convite = await Convite.findOne({ codigo, status: 'pendente' }).populate('nutricionistaId', 'nome clinica especializacao');

    if (!convite) {
      return res.status(404).json({ message: 'Convite não encontrado, inválido ou já utilizado.' });
    }
    res.status(200).json({ nutricionista: convite.nutricionistaId });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar informações do convite.', error: error.message });
  }
};

// @desc    Paciente aceita um convite
// @route   POST /api/convites/aceitar
// @access  Private (Paciente)
exports.aceitarConvite = async (req, res) => {
    const { codigo } = req.body;
    const pacienteId = req.userId;

    try {
        const convite = await Convite.findOne({ codigo, status: 'pendente' });
        if (!convite) {
            return res.status(404).json({ message: 'Convite inválido ou já aceito.' });
        }

        const nutricionistaId = convite.nutricionistaId;
        const paciente = await User.findById(pacienteId);

        if (!nutricionistaId || !paciente) {
            return res.status(404).json({ message: 'Nutricionista ou Paciente não encontrado.' });
        }
        
        if (paciente.nutricionistaId) {
            return res.status(400).json({ message: 'Você já está vinculado a um nutricionista.' });
        }

        // --- CORREÇÃO APLICADA AQUI ---
        // Usamos o operador $addToSet do MongoDB, que só adiciona o ID se ele ainda não existir na lista.
        // Isto previne a duplicação de forma atómica e segura.
        const nutriAtualizado = await Nutricionista.findByIdAndUpdate(
            nutricionistaId,
            { $addToSet: { pacientes: pacienteId } },
            { new: true }
        );

        const totalPacientes = nutriAtualizado.pacientes.length;
        if (totalPacientes > nutriAtualizado.limiteGratis) {
            // Se o limite foi ultrapassado, revertemos a operação
            await Nutricionista.findByIdAndUpdate(nutricionistaId, { $pull: { pacientes: pacienteId } });
            return res.status(403).json({ message: 'O nutricionista atingiu o limite de pacientes.' });
        }

        paciente.nutricionistaId = nutricionistaId;
        await paciente.save();

        convite.status = 'aceito';
        await convite.save();
        
        res.status(200).json({ message: 'Convite aceito com sucesso! Você foi vinculado ao seu nutricionista.' });
    } catch (error) {
        console.error("Erro ao aceitar convite:", error);
        res.status(500).json({ message: 'Erro no servidor ao aceitar convite.', error: error.message });
    }
};