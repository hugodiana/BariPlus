// server/controllers/publicController.js
const Agendamento = require('../models/Agendamento');
const Nutricionista = require('../models/Nutricionista'); // Import Nutricionista model

exports.confirmarConsultaPublico = async (req, res) => {
    try {
        const { consultaId, token } = req.params;
        const consulta = await Agendamento.findOne({
            _id: consultaId,
            confirmationToken: token
        });

        if (!consulta) {
            return res.status(400).send('<h1>Link de confirmação inválido ou expirado.</h1>');
        }

        consulta.status = 'Confirmado';
        // Opcional: remover o token após o uso para segurança
        // consulta.confirmationToken = undefined; 
        await consulta.save();
        
        // Envia uma página HTML simples de confirmação
        res.send('<h1>Consulta Confirmada com Sucesso!</h1><p>O seu nutricionista foi notificado. Obrigado!</p>');

    } catch (error) {
        res.status(500).send('<h1>Ocorreu um erro ao processar a sua confirmação.</h1>');
    }
};

exports.getNutricionistaDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const nutricionista = await Nutricionista.findById(id).select('nome email crn especializacao clinica fotoPerfilUrl'); // Select non-sensitive fields
        if (!nutricionista) {
            return res.status(404).json({ message: 'Nutricionista não encontrado.' });
        }
        res.json(nutricionista);
    } catch (error) {
        console.error("Erro ao buscar detalhes do nutricionista público:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};