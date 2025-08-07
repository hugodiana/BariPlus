const mongoose = require('mongoose');

const ExamsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    examEntries: [{
        name: { type: String, required: true },
        unit: { type: String, required: true },
        refMin: { type: Number },
        refMax: { type: Number },
        history: [{
            date: { type: Date, required: true },
            value: { type: Number, required: true },
            notes: String
        }]
    }]
}, { timestamps: true });

const Exams = mongoose.model('Exams', ExamsSchema);

module.exports = Exams;