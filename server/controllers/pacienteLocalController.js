// server/controllers/pacienteLocalController.js
const PacienteNutri = require('../models/PacienteNutri');
const Nutricionista = require('../models/Nutricionista');
// --- IMPORTAÇÕES QUE FALTAVAM, ADICIONADAS AQUI ---
const User = require('../models/userModel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const resend = new Resend(process.env.RESEND_API_KEY);

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

// @desc    Conceder acesso gratuito ao BariPlus para um paciente local
// @route   POST /api/nutri/pacientes-locais/:id/conceder-acesso
exports.concederAcessoBariplus = async (req, res) => {
    try {
        const { id: pacienteLocalId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        const nutricionista = await Nutricionista.findById(nutricionistaId);
        const pacienteLocal = await PacienteNutri.findById(pacienteLocalId);

        if (!pacienteLocal || pacienteLocal.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        if (!pacienteLocal.email) {
            return res.status(400).json({ message: 'O paciente precisa de ter um e-mail registado para receber o convite.' });
        }

        const totalPacientesBariplus = nutricionista.pacientesBariplus.length;
        const vagasDisponiveis = 5; // Lógica de vagas de exemplo. Pode ser expandida com base no plano.
        if (totalPacientesBariplus >= vagasDisponiveis) {
            return res.status(403).json({ message: 'Você atingiu o limite de vagas gratuitas do BariPlus.' });
        }

        const temporaryPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        
        const novoUsuarioBariplus = new User({
            nome: pacienteLocal.nomeCompleto.split(' ')[0],
            sobrenome: pacienteLocal.nomeCompleto.split(' ').slice(1).join(' '),
            email: pacienteLocal.email,
            password: hashedPassword,
            isEmailVerified: true,
            pagamentoEfetuado: true,
            nutricionistaId: nutricionistaId,
        });
        await novoUsuarioBariplus.save();
        
        await Nutricionista.findByIdAndUpdate(nutricionistaId, {
            $addToSet: { pacientesBariplus: novoUsuarioBariplus._id },
            $pull: { pacientesLocais: pacienteLocalId }
        });

        await PacienteNutri.findByIdAndDelete(pacienteLocalId);
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        novoUsuarioBariplus.resetPasswordToken = resetToken;
        novoUsuarioBariplus.resetPasswordExpires = Date.now() + 24 * 3600000;
        await novoUsuarioBariplus.save();
        
        const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const emailHtml = emailTemplate(
            `Seu Nutricionista Convidou Você para o BariPlus!`, 
            `Olá, ${novoUsuarioBariplus.nome}! O seu nutricionista, ${nutricionista.nome}, concedeu-lhe acesso gratuito à plataforma BariPlus. Clique no botão abaixo para criar a sua senha e começar a sua jornada.`, 
            'Criar Minha Senha', 
            setupPasswordLink
        );

        await resend.emails.send({
            from: `BariPlus <onboarding@resend.dev>`,
            to: [novoUsuarioBariplus.email],
            subject: 'Convite para o BariPlus',
            html: emailHtml
        });
        
        res.status(200).json({ message: 'Acesso concedido e convite enviado com sucesso!' });

    } catch (error) {
        console.error("Erro ao conceder acesso:", error);
        res.status(500).json({ message: 'Erro no servidor ao conceder acesso.' });
    }
};