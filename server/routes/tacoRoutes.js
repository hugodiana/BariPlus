const express = require('express');
const { request, gql } = require('graphql-request');
const router = express.Router();

// ✅ USA A SUA NOVA URL ATRAVÉS DE UMA VARIÁVEL DE AMBIENTE
const TACO_API_ENDPOINT = process.env.TACO_API_URL;

const GET_FOODS_QUERY = gql`
  query GetFoodsByName($name: String!) {
    foods(filter: { description: { contains: $name } }) {
      nodes {
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
  }
`;

router.get('/buscar', async (req, res) => {
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
        const alimentosFormatados = response.foods.nodes.map(alimento => ({
            description: alimento.description,
            kcal: alimento.attributes.energy_kcal?.value || 0,
            carbohydrates: alimento.attributes.carbohydrate?.value || 0,
            protein: alimento.attributes.protein?.value || 0,
            lipids: alimento.attributes.lipid?.value || 0,
            base_unit: `${alimento.base_qty} ${alimento.base_unit}`
        }));
        res.json(alimentosFormatados);
    } catch (error) {
        console.error("Erro ao buscar na API da TACO:", error);
        res.status(500).json({ message: "Erro ao comunicar com a base de dados de alimentos." });
    }
});

module.exports = router;