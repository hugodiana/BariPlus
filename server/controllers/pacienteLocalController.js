// server/controllers/pacienteLocalController.js
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/User');
const Prontuario = require('../models/Prontuario');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const emailTemplate = require('../utils/emailTemplate');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.createPacienteProntuario = async (req, res) => {
    try {
        const nutricionistaId = req.nutricionista.id;
        const { nomeCompleto, email, telefone, dataNascimento } = req.body;

        if (!nomeCompleto) {
            return res.status(400).json({ message: 'O nome do paciente é obrigatório.' });
        }
        
        if (email) {
            const userExists = await User.findOne({ email, statusConta: 'ativo' });
            if (userExists) {
                return res.status(400).json({ message: 'Já existe uma conta BariPlus ativa com este e-mail.' });
            }
        }
        
        const novoPaciente = await User.create({
            nome: nomeCompleto.split(' ')[0],
            sobrenome: nomeCompleto.split(' ').slice(1).join(' ') || '',
            email: email || null,
            statusConta: 'pendente_prontuario',
            nutricionistaId: nutricionistaId,
        });

        await Prontuario.create({
            pacienteId: novoPaciente._id,
            nutricionistaId,
            dadosPessoais: { dataNascimento, telefone }
        });

        await Nutricionista.findByIdAndUpdate(nutricionistaId, {
            $addToSet: { pacientes: novoPaciente._id }
        });
        
        res.status(201).json(novoPaciente);
    } catch (error) {
        console.error("Erro ao criar paciente:", error);
        res.status(500).json({ message: 'Erro ao criar paciente.', error: error.message });
    }
};

exports.convidarPacienteParaApp = async (req, res) => {
    try {
        const { id: pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        const nutricionista = await Nutricionista.findById(nutricionistaId);
        const paciente = await User.findById(pacienteId);

        if (!paciente || !paciente.nutricionistaId || paciente.nutricionistaId.toString() !== nutricionistaId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        if (!paciente.email) {
            return res.status(400).json({ message: 'O paciente precisa de ter um e-mail registado para receber o convite.' });
        }
        if (paciente.statusConta === 'ativo') {
             return res.status(400).json({ message: 'Este paciente já tem uma conta BariPlus ativa.' });
        }

        const temporaryPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        paciente.password = hashedPassword;
        paciente.isEmailVerified = true;
        paciente.pagamentoEfetuado = true;
        paciente.statusConta = 'ativo';
        paciente.resetPasswordToken = resetToken;
        paciente.resetPasswordExpires = Date.now() + 24 * 3600000;
        await paciente.save();
        
        const setupPasswordLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const emailHtml = emailTemplate(
            `O seu nutricionista convidou-o para o BariPlus!`, 
            `Olá, ${paciente.nome}! O seu nutricionista, ${nutricionista.nome}, concedeu-lhe acesso à plataforma BariPlus. Clique no botão abaixo para criar a sua senha e começar a sua jornada.`, 
            'Criar Minha Senha', 
            setupPasswordLink
        );

        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [paciente.email],
            subject: 'Convite para o BariPlus',
            html: emailHtml
        });
        
        res.status(200).json({ message: 'Convite enviado com sucesso!' });

    } catch (error) {
        console.error("Erro ao conceder acesso:", error);
        res.status(500).json({ message: 'Erro no servidor ao conceder acesso.' });
    }
};