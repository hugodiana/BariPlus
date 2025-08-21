// server/controllers/prontuarioController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const resend = new Resend(process.env.RESEND_API_KEY);

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
                historicoAlimentar: { recordatorio24h: [] },
                examesBioquimicos: [] // ✅ INICIA O NOVO CAMPO
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

        if (updateData.dadosPessoais && updateData.dadosPessoais.dataNascimento) {
            updateData.dadosPessoais.dataNascimento = fixDateTimezone(updateData.dadosPessoais.dataNascimento);
        }

        const updatedProntuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $set: updateData }, // O $set agora vai guardar a estrutura completa da anamnese
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
        
        if (avaliacaoData.data) {
            avaliacaoData.data = fixDateTimezone(avaliacaoData.data);
        }

        // ✅ CÁLCULO ATUALIZADO para incluir massa gorda
        if (avaliacaoData.peso && avaliacaoData.altura) {
            const alturaEmMetros = Number(avaliacaoData.altura) / 100;
            avaliacaoData.imc = (Number(avaliacaoData.peso) / (alturaEmMetros * alturaEmMetros)).toFixed(2);
        }
        if (avaliacaoData.peso && avaliacaoData.composicaoCorporal?.percentualGordura) {
            avaliacaoData.composicaoCorporal.massaGordaKg = (Number(avaliacaoData.peso) * (Number(avaliacaoData.composicaoCorporal.percentualGordura) / 100)).toFixed(2);
            avaliacaoData.composicaoCorporal.massaMagraKg = (Number(avaliacaoData.peso) - avaliacaoData.composicaoCorporal.massaGordaKg).toFixed(2);
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

const formatarAvaliacaoUnicaParaEmail = (avaliacao, paciente) => {
    let corpoHtml = `<p>Olá, ${paciente.nome}! Segue o resumo da sua avaliação física realizada em ${new Date(avaliacao.data).toLocaleDateString('pt-BR')}.</p>`;
    
    corpoHtml += `<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">`;
    corpoHtml += `<h3 style="color: #37715b;">Resultados Principais</h3>`;
    corpoHtml += `<p><strong>Peso:</strong> ${avaliacao.peso || '-'} kg</p>`;
    corpoHtml += `<p><strong>Altura:</strong> ${avaliacao.altura || '-'} cm</p>`;
    corpoHtml += `<p><strong>IMC:</strong> ${avaliacao.imc || '-'}</p></div>`;

    // Adiciona a secção de Circunferências dinamicamente
    if (avaliacao.circunferencias && Object.keys(avaliacao.circunferencias).length > 0) {
        corpoHtml += `<div style="margin-top: 20px;"><h4 style="color: #37715b;">Circunferências (cm)</h4>`;
        for (const [key, value] of Object.entries(avaliacao.circunferencias)) {
            if(value) { // Só mostra se tiver um valor
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'); // Converte "bracoDireito" para "Braco Direito"
                corpoHtml += `<p><strong>${label}:</strong> ${value}</p>`;
            }
        }
        corpoHtml += `</div>`;
    }

    // Adiciona a secção de Dobras Cutâneas dinamicamente
    if (avaliacao.dobrasCutaneas && Object.keys(avaliacao.dobrasCutaneas).length > 0) {
        corpoHtml += `<div style="margin-top: 20px;"><h4 style="color: #37715b;">Dobras Cutâneas (mm)</h4>`;
        for (const [key, value] of Object.entries(avaliacao.dobrasCutaneas)) {
             if(value) {
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                corpoHtml += `<p><strong>${label}:</strong> ${value}</p>`;
            }
        }
        corpoHtml += `</div>`;
    }

    if (avaliacao.observacoes) {
        corpoHtml += `<div style="margin-top: 20px;"><h4 style="color: #37715b;">Observações do Nutricionista:</h4><p>${avaliacao.observacoes}</p></div>`;
    }

    return emailTemplate(`Sua Avaliação Física - ${new Date(avaliacao.data).toLocaleDateString('pt-BR')}`, corpoHtml, null, null);
};

// @desc    Enviar uma avaliação específica por e-mail
// @route   POST /api/nutri/prontuarios/:pacienteId/avaliacoes/:avaliacaoId/enviar-email
exports.enviarAvaliacaoUnicaPorEmail = async (req, res) => {
    try {
        const { pacienteId, avaliacaoId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        const prontuario = await Prontuario.findOne({ pacienteId });
        const paciente = await User.findById(pacienteId);
        const avaliacao = prontuario?.avaliacoes.id(avaliacaoId);
        if (!paciente || !paciente.email) return res.status(400).json({ message: 'Paciente sem e-mail cadastrado.' });
        if (!avaliacao) return res.status(404).json({ message: 'Avaliação não encontrada.' });
        const emailHtml = formatarAvaliacaoUnicaParaEmail(avaliacao, paciente);
        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [paciente.email],
            subject: `Sua Avaliação Física de ${new Date(avaliacao.data).toLocaleDateString('pt-BR')}`,
            html: emailHtml,
        });
        res.status(200).json({ message: 'Avaliação enviada com sucesso!' });
    } catch (error) {
        console.error("Erro ao enviar e-mail de avaliação:", error);
        res.status(500).json({ message: 'Erro ao enviar e-mail da avaliação.' });
    }
};

// @desc    Adicionar um novo exame bioquímico
// @route   POST /api/nutri/prontuarios/:pacienteId/exames
exports.addExameBioquimico = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $push: { examesBioquimicos: req.body } },
            { new: true, upsert: true }
        );
        res.status(201).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar exame.' });
    }
};

// @desc    Apagar um exame bioquímico
// @route   DELETE /api/nutri/prontuarios/:pacienteId/exames/:exameId
exports.deleteExameBioquimico = async (req, res) => {
     try {
        const { pacienteId, exameId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $pull: { examesBioquimicos: { _id: exameId } } },
            { new: true }
        );
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar exame.' });
    }
};