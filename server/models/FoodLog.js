const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
}, { timestamps: true });

const foodItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String },
    portion: { type: Number, required: true },
    nutrients: {
        calories: { type: Number, default: 0 },
        proteins: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 }
    },
    comments: [commentSchema] 
});

const FoodLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Adicionado required: true para o índice único
    refeicoes: {
        cafeDaManha: [foodItemSchema],
        almoco: [foodItemSchema],
        jantar: [foodItemSchema],
        lanches: [foodItemSchema]
    }
}, { timestamps: true });

FoodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const FoodLog = mongoose.model('FoodLog', FoodLogSchema);

module.exports = FoodLog;