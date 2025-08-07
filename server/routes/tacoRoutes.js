const express = require('express');
const { request, gql } = require('graphql-request');
const router = express.Router();
const autenticar = require('../middlewares/autenticar');


const TACO_API_ENDPOINT = 'https://taco-api.netlify.app/graphql';

// ✅ CORREÇÃO: Esta é a estrutura correta da "pergunta" para a API da TACO.
const GET_FOODS_QUERY = gql`
  query GetFoodsByName($name: String!) {
    food(name: $name) {
      description
      base_qty
      base_unit
      attributes {
        energy_kcal { value }
        carbohydrate { value }
        protein { value }
        lipid { value }
      }
    }
  }
`;

router.get('/buscar', async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm || searchTerm.length < 3) {
        return res.status(400).json({ message: "É necessário um termo de busca com pelo menos 3 letras." });
    }
    try {
        const variables = { name: searchTerm };
        const response = await request(TACO_API_ENDPOINT, GET_FOODS_QUERY, variables);

        // ✅ CORREÇÃO: Ajustamos como os dados são lidos da resposta
        const alimentosFormatados = response.food.map(alimento => ({
            description: alimento.description,
            kcal: alimento.attributes.energy_kcal?.value || 0,
            carbohydrates: alimento.attributes.carbohydrate?.value || 0,
            protein: alimento.attributes.protein?.value || 0,
            lipids: alimento.attributes.lipid?.value || 0,
            base_unit: `${alimento.base_qty}${alimento.base_unit}`
        }));
        res.json(alimentosFormatados);
    } catch (error) {
        console.error("Erro ao buscar na API da TACO:", error);
        res.status(500).json({ message: "Erro ao comunicar com a base de dados de alimentos." });
    }
});

module.exports = router;