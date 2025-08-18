// server/controllers/conviteController.js

const Convite = require('../models/Convite');
const Nutricionista = require('../models/Nutricionista');
const Paciente = require('../models/Paciente'); // <-- **IMPORTANTE:** Verifique se o caminho para seu modelo Paciente está correto.

// @desc    Nutricionista gera um novo convite
// @route   POST /api/nutri/convites/gerar
// @access  Private (Nutricionista)
exports.gerarConvite = async (req, res) => {
  try {
    const nutricionistaId = req.nutricionista.id;

    const convite = await Convite.create({ nutricionistaId });

    // Você pode customizar a URL base dependendo do seu frontend
    const urlConvite = `https://app.bariplus.com/convite/${convite.codigo}`;

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

    res.status(200).json({
      nutricionista: convite.nutricionistaId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar informações do convite.', error: error.message });
  }
};

// @desc    Paciente aceita um convite
// @route   POST /api/convites/aceitar
// @access  Private (Paciente)
exports.aceitarConvite = async (req, res) => {
    const { codigo } = req.body;
    const pacienteId = req.paciente.id; // <-- **IMPORTANTE:** Assumindo que você tem um middleware para autenticação de pacientes

    try {
        const convite = await Convite.findOne({ codigo, status: 'pendente' });
        if (!convite) {
            return res.status(404).json({ message: 'Convite inválido ou já aceito.' });
        }

        const nutricionista = await Nutricionista.findById(convite.nutricionistaId);
        const paciente = await Paciente.findById(pacienteId);

        if (!nutricionista || !paciente) {
            return res.status(404).json({ message: 'Nutricionista ou Paciente não encontrado.' });
        }
        
        // Verifica se o paciente já está vinculado a um nutri
        if (paciente.nutricionistaId) {
            return res.status(400).json({ message: 'Você já está vinculado a um nutricionista.' });
        }

        // --- Lógica de Validação de Vagas ---
        const totalPacientes = nutricionista.pacientes.length;
        if (totalPacientes >= nutricionista.limiteGratis) {
            // Futuramente, aqui entrará a lógica de pacientes extras pagos.
            return res.status(403).json({ message: 'O nutricionista atingiu o limite de pacientes.' });
        }

        // --- Cria o Vínculo ---
        // 1. Adiciona o paciente ao nutricionista
        nutricionista.pacientes.push(pacienteId);
        await nutricionista.save();

        // 2. Adiciona o nutricionista ao paciente
        paciente.nutricionistaId = nutricionista._id;
        await paciente.save();

        // 3. Atualiza o status do convite
        convite.status = 'aceito';
        await convite.save();
        
        res.status(200).json({ message: 'Convite aceito com sucesso! Você foi vinculado ao seu nutricionista.' });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao aceitar convite.', error: error.message });
    }
};