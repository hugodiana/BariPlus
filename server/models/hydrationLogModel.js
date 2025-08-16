const mongoose = require('mongoose');

const DrinkEntrySchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ['Água', 'Chá', 'Isotónico', 'Outro'], 
        default: 'Água' 
    },
    amount: { type: Number, required: true }, // em ml
    timestamp: { type: Date, default: Date.now }
}, { _id: true });

const HydrationLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Formato 'YYYY-MM-DD'
    entries: [DrinkEntrySchema]
});

HydrationLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const HydrationLog = mongoose.model('HydrationLog', HydrationLogSchema);

module.exports = HydrationLog;