// server/routes/tacoRoutes.js
const express = require('express');
const { request, gql } = require('graphql-request');
const router = express.Router();
// ✅ 1. IMPORTAR O MIDDLEWARE CORRETO
const authenticateAny = require('../middlewares/authenticateAny'); 

const TACO_API_ENDPOINT = process.env.TACO_API_URL;

const GET_FOODS_QUERY = gql`
  query GetFoodByName($name: String!) {
    getFoodByName(name: $name) {
      description: name
      nutrients {
        kcal
        carbohydrates
        protein
        lipids
      }
    }
  }
`;

// ✅ 2. APLICAR O MIDDLEWARE 'authenticateAny'
router.get('/buscar', authenticateAny, async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 3) {
        return res.status(400).json({ message: "É necessário um termo de busca com pelo menos 3 letras." });
    }
    try {
        if (!TACO_API_ENDPOINT) {
            throw new Error("A URL da API da TACO não está configurada.");
        }
        
        const variables = { name: searchTerm };
        const response = await request(TACO_API_ENDPOINT, GET_FOODS_QUERY, variables);

        const alimentosFormatados = response.getFoodByName.map(alimento => ({
            description: alimento.description,
            kcal: alimento.nutrients.kcal || 0,
            carbohydrates: alimento.nutrients.carbohydrates || 0,
            protein: alimento.nutrients.protein || 0,
            lipids: alimento.nutrients.lipids || 0,
            base_unit: 'por 100g'
        }));

        res.json(alimentosFormatados);
    } catch (error) {
        console.error("Erro ao buscar na API da TACO:", error);
        res.status(500).json({ message: "Erro ao comunicar com a base de dados de alimentos." });
    }
});

module.exports = router;