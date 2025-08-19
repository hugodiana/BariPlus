// server/models/ConversationModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderModel: { type: String, required: true, enum: ['User', 'Nutricionista'] },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverModel: { type: String, required: true, enum: ['User', 'Nutricionista'] },
    content: { type: String, required: true, trim: true },
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
    participants: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: { type: String, required: true, enum: ['User', 'Nutricionista'] }
    }],
    messages: [messageSchema]
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;