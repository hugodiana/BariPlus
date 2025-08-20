// server/controllers/prontuarioController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');

// ✅ 1. ADICIONE ESTA FUNÇÃO AUXILIAR NO TOPO DO FICHEIRO
// Esta função é a chave para corrigir o problema do fuso horário.
const fixDateTimezone = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    // Adiciona o horário ao meio-dia em UTC para garantir que o dia não mude
    const date = new Date(`${dateString}T12:00:00Z`);
    return date;
};

const checkOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    return nutri && nutri.pacientes.some(pId => pId.toString() === pacienteId);
};

exports.getProntuario = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        if (!await checkOwnership(nutricionistaId, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        let prontuario = await Prontuario.findOne({ pacienteId });

        if (!prontuario) {
            prontuario = await Prontuario.create({ 
                pacienteId, 
                nutricionistaId,
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

exports.updateAnamnese = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        
        const updateData = req.body;

        // ✅ 2. APLIQUE A CORREÇÃO NA DATA DE NASCIMENTO
        if (updateData.dadosPessoais && updateData.dadosPessoais.dataNascimento) {
            updateData.dadosPessoais.dataNascimento = fixDateTimezone(updateData.dadosPessoais.dataNascimento);
        }

        const updatedProntuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $set: updateData },
            { new: true, upsert: true }
        );
        res.json(updatedProntuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar anamnese.' });
    }
};

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
        
        const avaliacaoData = req.body;
        
        // ✅ 3. APLIQUE A CORREÇÃO NA DATA DA AVALIAÇÃO
        if (avaliacaoData.data) {
            avaliacaoData.data = fixDateTimezone(avaliacaoData.data);
        }

        if (avaliacaoData.peso && avaliacaoData.altura) {
            const alturaEmMetros = Number(avaliacaoData.altura) / 100;
            avaliacaoData.imc = (Number(avaliacaoData.peso) / (alturaEmMetros * alturaEmMetros)).toFixed(2);
        }
        
        prontuario.avaliacoes.push(avaliacaoData);
        await prontuario.save();
        
        res.status(201).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar avaliação.' });
    }
};

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
        
        prontuario.evolucao.push({ nota });
        await prontuario.save();
        
        res.status(201).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar nota de evolução.' });
    }
};