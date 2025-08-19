// server/controllers/messageController.js
const Conversation = require('../models/ConversationModel');

// @desc    Obter a conversa entre o profissional e um paciente específico
// @route   GET /api/nutri/pacientes/:pacienteId/conversation
exports.getConversationForNutri = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const nutricionistaId = req.nutricionista.id;

        let conversation = await Conversation.findOne({
            'participants.userId': { $all: [nutricionistaId, pacienteId] }
        });

        if (!conversation) {
            return res.json({ messages: [] }); // Retorna vazio se não houver conversa
        }
        res.json(conversation);
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
        const senderId = req.user ? req.userId : req.nutricionista.id; // Funciona para ambos
        const senderModel = req.user ? 'User' : 'Nutricionista';
        
        const receiverModel = await User.exists({_id: receiverId}) ? 'User' : 'Nutricionista';

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

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: "Erro ao enviar mensagem." });
    }
};