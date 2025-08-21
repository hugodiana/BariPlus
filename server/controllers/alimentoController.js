// server/controllers/alimentoController.js
const Nutricionista = require('../models/Nutricionista');

// @desc    Adicionar um alimento personalizado
// @route   POST /api/nutri/alimentos
exports.addAlimento = async (req, res) => {
    try {
        const nutricionista = await Nutricionista.findById(req.nutricionista.id);
        nutricionista.alimentosPersonalizados.push(req.body);
        await nutricionista.save();
        res.status(201).json(nutricionista.alimentosPersonalizados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar alimento.' });
    }
};

// @desc    Apagar um alimento personalizado
// @route   DELETE /api/nutri/alimentos/:alimentoId
exports.deleteAlimento = async (req, res) => {
     try {
        const nutricionista = await Nutricionista.findByIdAndUpdate(
            req.nutricionista.id,
            { $pull: { alimentosPersonalizados: { _id: req.params.alimentoId } } },
            { new: true }
        );
        res.status(200).json(nutricionista.alimentosPersonalizados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar alimento.' });
    }
};