// server/controllers/pacienteLocalController.js
const PacienteNutri = require('../models/PacienteNutri');
const Nutricionista = require('../models/Nutricionista');

// @desc    Criar um novo paciente local
// @route   POST /api/nutri/pacientes-locais
exports.createPacienteLocal = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { nomeCompleto, email, telefone, dataNascimento } = req.body;

        if (!nomeCompleto) {
            return res.status(400).json({ message: 'O nome do paciente é obrigatório.' });
        }

        const novoPaciente = await PacienteNutri.create({
            nutricionistaId,
            nomeCompleto, email, telefone, dataNascimento
        });

        // Adiciona o novo paciente à lista do nutricionista
        await Nutricionista.findByIdAndUpdate(nutricionistaId, {
            $push: { pacientesLocais: novoPaciente._id }
        });
        
        res.status(201).json(novoPaciente);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar paciente.', error: error.message });
    }
};

// @desc    Listar todos os pacientes locais de um nutricionista
// @route   GET /api/nutri/pacientes-locais
exports.getPacientesLocais = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const pacientes = await PacienteNutri.find({ nutricionistaId });
        res.json(pacientes);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pacientes.' });
    }
};