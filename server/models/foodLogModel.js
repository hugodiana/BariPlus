const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: String,
    brand: String,
    portion: Number,
    nutrients: {
        calories: Number,
        proteins: Number,
        carbs: Number,
        fats: Number
    }
});

const FoodLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: String,
    refeicoes: {
        cafeDaManha: [foodItemSchema],
        almoco: [foodItemSchema],
        jantar: [foodItemSchema],
        lanches: [foodItemSchema]
    }
}, { timestamps: true });

const FoodLog = mongoose.model('FoodLog', FoodLogSchema);

module.exports = FoodLog;