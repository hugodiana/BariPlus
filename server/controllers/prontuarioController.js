// server/controllers/prontuarioController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel'); // Importar o User para popular o nome

// Função auxiliar para verificar se o paciente pertence ao nutricionista
const checkOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    // ✅ CORREÇÃO: Verifica na lista unificada 'pacientes'
    return nutri && nutri.pacientes.some(pId => pId.toString() === pacienteId);
};

// @desc    Obter o prontuário de um paciente
// @route   GET /api/nutri/prontuarios/:pacienteId
exports.getProntuario = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        if (!await checkOwnership(nutricionistaId, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        let prontuario = await Prontuario.findOne({ pacienteId });

        if (!prontuario) {
            // Se não existir, cria um prontuário básico ao aceder pela primeira vez
            prontuario = await Prontuario.create({ 
                pacienteId, 
                nutricionistaId,
                // Inicia os objetos para evitar erros no frontend
                dadosPessoais: {},
                historicoClinico: { doencasPrevias: [] },
                habitosDeVida: {},
                historicoAlimentar: { recordatorio24h: [] }
            });
        }
        
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar prontuário.' });
    }
};

// @desc    Atualizar a anamnese de um prontuário
// @route   PUT /api/nutri/prontuarios/:pacienteId/anamnese
exports.updateAnamnese = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        
        // ✅ LÓGICA ATUALIZADA para lidar com o objeto complexo
        const { dadosPessoais, historicoClinico, habitosDeVida, historicoAlimentar, objetivo } = req.body;

        const updatedProntuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $set: { 
                dadosPessoais, 
                historicoClinico, 
                habitosDeVida, 
                historicoAlimentar, 
                objetivo 
            }},
            { new: true, upsert: true } // upsert: true garante que o prontuário é criado se não existir
        );
        res.json(updatedProntuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar anamnese.' });
    }
};

// @desc    Adicionar uma nova avaliação física
// @route   POST /api/nutri/prontuarios/:pacienteId/avaliacoes
exports.addAvaliacao = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        if (!prontuario) {
            return res.status(404).json({ message: 'Prontuário não encontrado.' });
        }
        
        // Calcula o IMC se peso e altura forem fornecidos
        const { peso, altura } = req.body;
        if (peso && altura) {
            const alturaEmMetros = Number(altura) / 100;
            req.body.imc = (Number(peso) / (alturaEmMetros * alturaEmMetros)).toFixed(2);
        }
        
        prontuario.avaliacoes.push(req.body);
        await prontuario.save();
        
        res.status(201).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar avaliação.' });
    }
};

// @desc    Adicionar uma nova nota de evolução
// @route   POST /api/nutri/prontuarios/:pacienteId/evolucao
exports.addEvolucao = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        if (!prontuario) {
            return res.status(404).json({ message: 'Prontuário não encontrado.' });
        }
        
        const { nota } = req.body;
        if (!nota) {
            return res.status(400).json({ message: 'A nota de evolução não pode estar vazia.' });
        }
        
        prontuario.evolucao.push({ nota }); // Adiciona a nova nota com a data padrão (agora)
        await prontuario.save();
        
        res.status(201).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar nota de evolução.' });
    }
};