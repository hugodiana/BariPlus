// server/controllers/messageController.js
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Nutricionista = require('../models/Nutricionista');

// @desc    Obter a conversa entre o profissional e um paciente específico
// @route   GET /api/nutri/pacientes/:pacienteId/conversation
exports.getConversationForNutri = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        let conversation = await Conversation.findOne({
            'participants.userId': { $all: [nutricionistaId, pacienteId] }
        });

        res.json(conversation || { messages: [] });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar conversa." });
    }
};

// @desc    Enviar uma mensagem
// @route   POST /api/messages/send/:receiverId
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const { content } = req.body;

        // --- CORREÇÃO APLICADA AQUI ---
        // Identifica o remetente com base no que o middleware de autenticação forneceu
        const senderId = req.userId || req.nutricionista?.id;
        const senderModel = req.userId ? 'User' : 'Nutricionista';
        
        if (!senderId) {
            return res.status(401).json({ message: 'Remetente não autenticado.' });
        }
        
        // Descobre se o destinatário é um User ou Nutricionista
        const receiverIsUser = await User.exists({ _id: receiverId });
        const receiverModel = receiverIsUser ? 'User' : 'Nutricionista';

        let conversation = await Conversation.findOne({
            'participants.userId': { $all: [senderId, receiverId] }
        });

        const newMessage = { senderId, senderModel, receiverId, receiverModel, content };

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [
                    { userId: senderId, userModel: senderModel },
                    { userId: receiverId, userModel: receiverModel }
                ],
                messages: [newMessage]
            });
        } else {
            conversation.messages.push(newMessage);
            await conversation.save();
        }

        // Devolve a última mensagem adicionada com todos os dados
        res.status(201).json(conversation.messages[conversation.messages.length - 1]);
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        res.status(500).json({ message: "Erro ao enviar mensagem." });
    }
};

// @desc    Obter a conversa entre o paciente e o seu nutricionista
// @route   GET /api/conversation
exports.getConversationForPatient = async (req, res) => {
    try {
        const pacienteId = req.userId;
        const paciente = await User.findById(pacienteId);

        if (!paciente.nutricionistaId) {
            return res.status(404).json({ message: 'Você não está vinculado a um nutricionista.' });
        }

        let conversation = await Conversation.findOne({
            'participants.userId': { $all: [pacienteId, paciente.nutricionistaId] }
        });
        
        res.json(conversation || { messages: [] });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar conversa." });
    }
};