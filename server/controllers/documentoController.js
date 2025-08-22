// server/controllers/documentoController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const { v2: cloudinary } = require('cloudinary');

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
        
        // ✅ CORREÇÃO APLICADA AQUI
        // Para PDFs, forçamos a Cloudinary a tratá-los como imagens para garantir o acesso público.
        const resource_type = req.file.mimetype === 'application/pdf' ? 'image' : 'auto';

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `bariplus_documentos/${pacienteId}`,
            resource_type: resource_type,
            // A flag access_mode: 'public' pode não ser necessária, mas mantemo-la por segurança.
        });
        
        let finalUrl = result.secure_url;
        // Se for PDF, e a URL terminar com uma extensão de imagem, removemo-la para o link de download direto.
        if (req.file.mimetype === 'application/pdf' && (finalUrl.endsWith('.jpg') || finalUrl.endsWith('.png'))) {
            finalUrl = finalUrl.slice(0, -4);
        }

        const novoDocumento = {
            nome: nome || req.file.originalname,
            categoria: categoria || 'Geral',
            url: finalUrl,
            publicId: result.public_id
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
        if (!documento) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }

        // Para apagar, precisamos de saber o tipo de recurso original.
        const publicId = documento.publicId;
        const resourceType = publicId.endsWith('.pdf') ? 'raw' : 'image';
        
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
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