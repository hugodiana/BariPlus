// server/controllers/pesoController.js
const Peso = require('../models/Peso');
const User = require('../models/User');
const { v2: cloudinary } = require('cloudinary');
const conquistasService = require('../services/conquistasService');

// --- Funções do Controller ---

// GET /api/pesos - Buscar todos os registros de peso
exports.getPesos = async (req, res) => {
    try {
        const pesoDoc = await Peso.findOne({ userId: req.userId });
        if (!pesoDoc) {
            const newPesoDoc = new Peso({ userId: req.userId, registros: [] });
            await newPesoDoc.save();
            return res.json([]);
        }
        res.json(pesoDoc.registros);
    } catch (error) {
        console.error("Erro ao buscar histórico de peso:", error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

// POST /api/pesos - Adicionar um novo registro de peso
exports.addPeso = async (req, res) => {
    try {
        // ✅ 1. ADICIONADO 'notas' À DESESTRUTURAÇÃO
        const { peso, data, notas, ...medidas } = req.body;
        
        if (!peso) {
            return res.status(400).json({ message: 'O peso é obrigatório.' });
        }
        const pesoNum = parseFloat(peso);

        let fotoUrl = '';
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: 'bariplus_progress' });
            fotoUrl = result.secure_url;
        }

        const novoRegistro = {
            peso: pesoNum,
            data: data ? new Date(data) : new Date(),
            fotoUrl,
            notas: notas || '', // ✅ 2. ADICIONADO CAMPO 'notas' AO NOVO REGISTO
            medidas: {
                pescoco: parseFloat(medidas.pescoco) || null,
                torax: parseFloat(medidas.torax) || null,
                cintura: parseFloat(medidas.cintura) || null,
                abdomen: parseFloat(medidas.abdomen) || null,
                quadril: parseFloat(medidas.quadril) || null,
                bracoDireito: parseFloat(medidas.bracoDireito) || null,
                bracoEsquerdo: parseFloat(medidas.bracoEsquerdo) || null,
                antebracoDireito: parseFloat(medidas.antebracoDireito) || null,
                antebracoEsquerdo: parseFloat(medidas.antebracoEsquerdo) || null,
                coxaDireita: parseFloat(medidas.coxaDireita) || null,
                coxaEsquerda: parseFloat(medidas.coxaEsquerda) || null,
                panturrilhaDireita: parseFloat(medidas.panturrilhaDireita) || null,
                panturrilhaEsquerda: parseFloat(medidas.panturrilhaEsquerda) || null
            }
        };

        const pesoDoc = await Peso.findOneAndUpdate(
            { userId: req.userId },
            { $push: { registros: novoRegistro } },
            { new: true, upsert: true }
        );

        const ultimoRegistro = pesoDoc.registros.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": ultimoRegistro.peso } });

        const novasConquistas = await conquistasService.verificarConquistas(req.userId);

        res.status(201).json({ 
            registro: pesoDoc.registros[pesoDoc.registros.length - 1],
            novasConquistas
        });
    } catch (error) {
        console.error('Erro ao registrar peso:', error);
        res.status(500).json({ message: 'Erro ao registrar peso.' });
    }
};

// PUT /api/pesos/:registroId - Atualizar um registro de peso
exports.updatePeso = async (req, res) => {
    try {
        const { registroId } = req.params;
        const updates = req.body;

        const pesoDoc = await Peso.findOne({ userId: req.userId });
        if (!pesoDoc) return res.status(404).json({ message: "Histórico de peso não encontrado." });

        const registro = pesoDoc.registros.id(registroId);
        if (!registro) return res.status(404).json({ message: "Registro não encontrado." });

        Object.keys(updates).forEach(key => {
            if (key === 'peso') {
                registro[key] = parseFloat(updates[key]);
            } else if (key === 'notas') { // ✅ 3. ADICIONADO LÓGICA PARA ATUALIZAR NOTAS
                registro[key] = updates[key];
            } else if (registro.medidas && key in registro.medidas) {
                registro.medidas[key] = parseFloat(updates[key]) || null;
            }
        });
        
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "bariplus_progress" });
            registro.fotoUrl = result.secure_url;
        }
        
        pesoDoc.markModified('registros');
        await pesoDoc.save();
        
        const ultimoRegistro = pesoDoc.registros.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
        await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": ultimoRegistro.peso } });

        res.json(registro);
    } catch (error) {
        console.error("Erro ao atualizar registro:", error);
        res.status(500).json({ message: 'Erro ao atualizar registro.' });
    }
};

// DELETE /api/pesos/:registroId - Apagar um registro de peso
exports.deletePeso = async (req, res) => {
    try {
        const { registroId } = req.params;
        const pesoDoc = await Peso.findOne({ userId: req.userId });
        if (!pesoDoc) return res.status(404).json({ message: "Nenhum registro encontrado." });
        
        pesoDoc.registros.pull({ _id: registroId });
        await pesoDoc.save();
        
        if (pesoDoc.registros.length > 0) {
            const ultimoRegistro = pesoDoc.registros.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
            await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": ultimoRegistro.peso } });
        } else {
            const usuario = await User.findById(req.userId);
            if (usuario) {
                await User.findByIdAndUpdate(req.userId, { $set: { "detalhesCirurgia.pesoAtual": usuario.detalhesCirurgia.pesoInicial } });
            }
        }
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao apagar registro:", error);
        res.status(500).json({ message: 'Erro ao apagar registro.' });
    }
};