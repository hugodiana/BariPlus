const mongoose = require('mongoose');

const ChecklistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    preOp: [{ descricao: String, concluido: Boolean }],
    posOp: [{ descricao: String, concluido: Boolean }]
});

const Checklist = mongoose.model('Checklist', ChecklistSchema);

module.exports = Checklist;