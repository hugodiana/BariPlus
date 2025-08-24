const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: String,
    waterConsumed: { type: Number, default: 0 },
    proteinConsumed: { type: Number, default: 0 }
});

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model('DailyLog', DailyLogSchema);

module.exports = DailyLog;