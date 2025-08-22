// server/controllers/documentoController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const User = require('../models/userModel'); // ✅ Importar User
const { v2: cloudinary } = require('cloudinary');
const { Resend } = require('resend'); // ✅ Importar Resend
const emailTemplate = require('../utils/emailTemplate'); // ✅ Importar Template
const resend = new Resend(process.env.RESEND_API_KEY);

const checkOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    return nutri && nutri.pacientes.some(pId => pId.toString() === pacienteId);
};

exports.uploadDocumento = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { nome, categoria } = req.body;

        if (!req.file) return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // PDFs devem ser tratados como 'raw', imagens como 'image'.
        const resource_type = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `bariplus_documentos/${pacienteId}`,
            resource_type: resource_type,
        });

        let finalUrl = result.secure_url;

        // ✅ A CORREÇÃO DEFINITIVA ESTÁ AQUI
        // Se for um ficheiro 'raw' (como PDF), modificamos a URL para forçar o download.
        if (resource_type === 'raw') {
            const urlParts = finalUrl.split('/upload/');
            // Insere a flag 'fl_attachment' na URL.
            finalUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
        }
        
        const novoDocumento = {
            nome: nome || req.file.originalname,
            categoria: categoria || 'Geral',
            url: finalUrl,
            publicId: result.public_id,
            resourceType: resource_type
        };

        const prontuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $push: { documentos: novoDocumento } },
            { new: true, upsert: true }
        );
        res.status(201).json(prontuario);

    } catch (error) {
        console.error("Erro no upload do documento:", error);
        res.status(500).json({ message: 'Erro no servidor ao fazer upload do documento.' });
    }
};

exports.deleteDocumento = async (req, res) => {
    try {
        const { pacienteId, docId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        const documento = prontuario.documentos.id(docId);
        if (!documento) return res.status(404).json({ message: 'Documento não encontrado.' });
        
        // Usa o resourceType guardado para apagar o ficheiro corretamente.
        await cloudinary.uploader.destroy(documento.publicId, { resource_type: documento.resourceType });
        
        const updatedProntuario = await Prontuario.findOneAndUpdate(
            { pacienteId },
            { $pull: { documentos: { _id: docId } } },
            { new: true }
        );
        res.json(updatedProntuario);
    } catch (error) {
        console.error("Erro ao apagar documento:", error);
        res.status(500).json({ message: 'Erro ao apagar o documento.' });
    }
};

exports.toggleShareDocumento = async (req, res) => {
    try {
        const { pacienteId, docId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        const documento = prontuario.documentos.id(docId);
        if (!documento) return res.status(404).json({ message: 'Documento não encontrado.' });

        // Inverte o estado atual de 'partilhado'
        documento.partilhado = !documento.partilhado;
        await prontuario.save();

        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar a partilha do documento.' });
    }
};

// ✅ NOVA FUNÇÃO PARA ENVIAR UM DOCUMENTO POR E-MAIL
exports.sendDocumentoPorEmail = async (req, res) => {
    try {
        const { pacienteId, docId } = req.params;
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const prontuario = await Prontuario.findOne({ pacienteId });
        const paciente = await User.findById(pacienteId);
        const documento = prontuario?.documentos.id(docId);

        if (!paciente || !paciente.email) return res.status(400).json({ message: 'Paciente sem e-mail cadastrado.' });
        if (!documento) return res.status(404).json({ message: 'Documento não encontrado.' });

        const emailHtml = emailTemplate(
            'Documento Partilhado pelo seu Nutricionista',
            `Olá, ${paciente.nome}! O seu nutricionista partilhou um novo documento consigo: "${documento.nome}". Clique no botão abaixo para o visualizar e baixar.`,
            'Ver Documento',
            documento.url
        );

        await resend.emails.send({
            from: `BariPlus <${process.env.MAIL_FROM_ADDRESS}>`,
            to: [paciente.email],
            subject: `Novo Documento: ${documento.nome}`,
            html: emailHtml,
        });

        res.status(200).json({ message: 'Documento enviado por e-mail com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao enviar e-mail do documento.' });
    }
};