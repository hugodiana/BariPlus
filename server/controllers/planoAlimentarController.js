// server/controllers/planoAlimentarController.js

const PlanoAlimentar = require('../models/PlanoAlimentar');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const resend = new Resend(process.env.RESEND_API_KEY);


// @desc    Nutricionista cria um novo plano alimentar para um paciente
// @route   POST /api/nutri/planos/criar
exports.criarPlanoAlimentar = async (req, res) => {
  const nutricionistaId = req.nutricionista.id;
  // ✅ 1. RECEBER AS NOVAS METAS DO CORPO DA REQUISIÇÃO
  const { pacienteId, titulo, refeicoes, observacoesGerais, metas } = req.body;

  if (!pacienteId || !titulo || !refeicoes) {
    return res.status(400).json({ message: 'Dados insuficientes para criar o plano.' });
  }

  try {
    const nutri = await Nutricionista.findById(nutricionistaId).populate('pacientes');
    
    const isMyPatient = nutri.pacientes.some(p => p._id.toString() === pacienteId);
    if (!isMyPatient) {
      return res.status(403).json({ message: 'Acesso negado. Este paciente não está vinculado a você.' });
    }

    // Desativa todos os outros planos do paciente
    await PlanoAlimentar.updateMany({ pacienteId: pacienteId }, { $set: { ativo: false } });
    
    // Cria o novo plano como ativo
    const novoPlano = await PlanoAlimentar.create({ 
        nutricionistaId, 
        pacienteId, 
        titulo, 
        refeicoes, 
        observacoesGerais,
        metas: metas || {}, // ✅ 2. GUARDA AS METAS NO NOVO PLANO
        ativo: true
    });
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
        
        // ✅ CORREÇÃO: Verifica na lista unificada 'pacientes'
        if (!nutri.pacientes.some(pId => pId.toString() === pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const planos = await PlanoAlimentar.find({ pacienteId }).sort({ createdAt: -1 });
        res.status(200).json(planos);

    } catch (error) {
        console.error("Erro ao buscar planos do paciente:", error);
        res.status(500).json({ message: 'Erro ao buscar planos do paciente.', error: error.message });
    }
};

// @desc    Nutricionista busca um plano alimentar específico pelo ID
// @route   GET /api/nutri/planos/:planoId
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

const formatarPlanoParaEmail = (plano, paciente) => {
    let corpoHtml = `<p>Olá, ${paciente.nome}! Segue em anexo o seu plano alimentar "${plano.titulo}".</p>`;
    
    plano.refeicoes.forEach(refeicao => {
        corpoHtml += `<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">`;
        corpoHtml += `<h3 style="color: #37715b;">${refeicao.nome} ${refeicao.horario ? `(${refeicao.horario})` : ''}</h3>`;
        corpoHtml += `<table style="width: 100%; border-collapse: collapse;">`;
        refeicao.itens.forEach(item => {
            corpoHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${item.alimento}</td><td style="padding: 8px; border-bottom: 1px solid #f0f0f0; text-align: right;"><strong>${item.quantidade}</strong></td></tr>`;
        });
        corpoHtml += `</table></div>`;
    });

    if (plano.observacoesGerais) {
        corpoHtml += `<div style="margin-top: 25px;"><h4 style="color: #37715b;">Observações Gerais:</h4><p style="white-space: pre-wrap;">${plano.observacoesGerais}</p></div>`;
    }

    return emailTemplate(
        `Seu Plano Alimentar: ${plano.titulo}`,
        corpoHtml,
        null,
        null
    );
};

// @desc    Enviar um plano alimentar por e-mail para o paciente
// @route   POST /api/nutri/planos/:planoId/enviar-email
exports.enviarPlanoPorEmail = async (req, res) => {
    try {
        const { planoId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        const plano = await PlanoAlimentar.findById(planoId);
        if (!plano || plano.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(404).json({ message: 'Plano não encontrado ou acesso negado.' });
        }

        const paciente = await User.findById(plano.pacienteId);
        if (!paciente || !paciente.email) {
            return res.status(400).json({ message: 'Paciente não tem um e-mail cadastrado para o envio.' });
        }

        const emailHtml = formatarPlanoParaEmail(plano, paciente);
        
        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [paciente.email],
            subject: `Seu Plano Alimentar - ${plano.titulo}`,
            html: emailHtml,
        });

        res.status(200).json({ message: `Plano enviado com sucesso para ${paciente.email}` });

    } catch (error) {
        console.error("Erro ao enviar e-mail com plano:", error);
        res.status(500).json({ message: 'Erro no servidor ao enviar o e-mail.' });
    }
};