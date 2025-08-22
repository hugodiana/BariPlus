// server/controllers/documentoController.js
const Prontuario = require('../models/Prontuario');
const Nutricionista = require('../models/Nutricionista');
const { v2: cloudinary } = require('cloudinary');

const checkOwnership = async (nutricionistaId, pacienteId) => {
    const nutri = await Nutricionista.findById(nutricionistaId);
    return nutri && nutri.pacientes.some(pId => pId.toString() === pacienteId);
};

// @desc    Fazer upload de um novo documento
// @route   POST /api/nutri/prontuarios/:pacienteId/documentos
exports.uploadDocumento = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { nome, categoria } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
        }
        if (!await checkOwnership(req.nutricionista.id, pacienteId)) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        // Faz o upload para a Cloudinary a partir do buffer do ficheiro
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `bariplus_documentos/${pacienteId}`, // Organiza os ficheiros por paciente
            resource_type: 'auto' // Permite o upload de PDFs, imagens, etc.
        });

        const novoDocumento = {
            nome: nome || req.file.originalname,
            categoria: categoria || 'Geral',
            url: result.secure_url,
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


// @desc    Apagar um documento
// @route   DELETE /api/nutri/prontuarios/:pacienteId/documentos/:docId
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

        // Apaga o ficheiro da Cloudinary
        await cloudinary.uploader.destroy(documento.publicId);
        
        // Remove a referência do documento da base de dados
        documento.remove();
        await prontuario.save();

        res.json(prontuario);
    } catch (error) {
        console.error("Erro ao apagar documento:", error);
        res.status(500).json({ message: 'Erro ao apagar o documento.' });
    }
};