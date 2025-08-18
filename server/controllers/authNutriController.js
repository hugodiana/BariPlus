// server/controllers/authNutriController.js

const Nutricionista = require('../models/Nutricionista');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Função para gerar o token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // O token expira em 30 dias
  });
};

// @desc    Registrar um novo nutricionista
// @route   POST /api/nutri/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { nome, email, senha, crn, especializacao, clinica } = req.body;

  try {
    // Verifica se já existe um nutri com o mesmo email ou CRN
    const nutriExists = await Nutricionista.findOne({ $or: [{ email }, { crn }] });
    if (nutriExists) {
      return res.status(400).json({ message: 'Nutricionista já cadastrado com este e-mail ou CRN.' });
    }

    // Cria o novo nutricionista (a senha será criptografada pelo hook no model)
    const nutricionista = await Nutricionista.create({
      nome,
      email,
      senha,
      crn,
      especializacao,
      clinica,
    });

    // Gera o token e envia a resposta
    const token = generateToken(nutricionista._id);
    res.status(201).json({
      token,
      nutricionista: {
        id: nutricionista._id,
        nome: nutricionista.nome,
        email: nutricionista.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao registrar nutricionista.', error: error.message });
  }
};

// @desc    Autenticar (login) um nutricionista
// @route   POST /api/nutri/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Procura o nutricionista pelo email e inclui a senha na busca
    const nutricionista = await Nutricionista.findOne({ email }).select('+senha');

    if (!nutricionista) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Compara a senha enviada com a senha no banco de dados
    const isMatch = await bcrypt.compare(senha, nutricionista.senha);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Gera o token e envia a resposta
    const token = generateToken(nutricionista._id);
    res.status(200).json({
      token,
      nutricionista: {
        id: nutricionista._id,
        nome: nutricionista.nome,
        email: nutricionista.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao fazer login.', error: error.message });
  }
};