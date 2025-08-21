// server/controllers/prontuarioController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');

// ✅ 1. ADICIONE ESTA FUNÇÃO AUXILIAR NO TOPO DO FICHEIRO
// Esta função é a chave para corrigir o problema do fuso horário.
const fixDateTimezone = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
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

const formatarAvaliacoesParaEmail = (avaliacoes, paciente) => {
    let corpoHtml = `<p>Olá, ${paciente.nome}! Segue o seu histórico de avaliações físicas.</p>`;
    corpoHtml += `<table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="padding: 8px; border: 1px solid #ddd;">Data</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Peso</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">IMC</th>
                        </tr>
                    </thead>
                    <tbody>`;
    avaliacoes.forEach(av => {
        corpoHtml += `<tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(av.data).toLocaleDateString('pt-BR')}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${av.peso || '-'} kg</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${av.imc || '-'}</td>
                      </tr>`;
    });
    corpoHtml += `</tbody></table>`;
    return emailTemplate(`Seu Histórico de Avaliações`, corpoHtml, null, null);
};

exports.enviarRelatorioAvaliacoes = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const prontuario = await Prontuario.findOne({ pacienteId });
        const paciente = await User.findById(pacienteId);

        if (!paciente.email) return res.status(400).json({ message: 'Paciente sem e-mail cadastrado.' });
        if (!prontuario || prontuario.avaliacoes.length === 0) return res.status(400).json({ message: 'Nenhuma avaliação para enviar.' });

        const emailHtml = formatarAvaliacoesParaEmail(prontuario.avaliacoes, paciente);
        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [paciente.email],
            subject: 'Seu Histórico de Avaliações Físicas',
            html: emailHtml,
        });
        res.status(200).json({ message: 'Relatório de avaliações enviado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao enviar relatório.' });
    }
};

// @desc    Editar uma avaliação física
// @route   PUT /api/nutri/prontuarios/:pacienteId/avaliacoes/:avaliacaoId
exports.updateAvaliacao = async (req, res) => {
    try {
        const { pacienteId, avaliacaoId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        const avaliacao = prontuario.avaliacoes.id(avaliacaoId);
        if (!avaliacao) return res.status(404).json({ message: 'Avaliação não encontrada.' });

        const updateData = req.body;
        if (updateData.data) updateData.data = fixDateTimezone(updateData.data);
        if (updateData.peso && updateData.altura) {
            const alturaEmMetros = Number(updateData.altura) / 100;
            updateData.imc = (Number(updateData.peso) / (alturaEmMetros * alturaEmMetros)).toFixed(2);
        }

        Object.assign(avaliacao, updateData);
        await prontuario.save();
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar avaliação.' });
    }
};

// @desc    Apagar uma avaliação física
// @route   DELETE /api/nutri/prontuarios/:pacienteId/avaliacoes/:avaliacaoId
exports.deleteAvaliacao = async (req, res) => {
    try {
        const { pacienteId, avaliacaoId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const updatedProntuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $pull: { avaliacoes: { _id: avaliacaoId } } },
            { new: true }
        );
        res.json(updatedProntuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar avaliação.' });
    }
};