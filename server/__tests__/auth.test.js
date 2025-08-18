const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

// Crie uma instância do Express APENAS para os testes
const app = express();
app.use(express.json());
app.use('/api', authRoutes); // Use as mesmas rotas que a sua aplicação principal

// --- Configuração da Base de Dados de Teste ---
beforeAll(async () => {
    // É crucial usar uma base de dados separada para os testes para não afetar os seus dados reais.
    // Pode ser uma base de dados local ou um cluster diferente no Atlas.
    // Lembre-se de criar um ficheiro .env.test com a URL da base de dados de teste.
    const mongoUri = process.env.DATABASE_URL_TEST; // Ex: mongodb://localhost:27017/BariPlusTest
    if (!mongoUri) {
        throw new Error('DATABASE_URL_TEST não foi definida. Crie um ficheiro .env.test');
    }
    await mongoose.connect(mongoUri);
});

// Limpa a base de dados após cada teste para garantir que os testes são independentes
afterEach(async () => {
    await User.deleteMany();
});

// Fecha a ligação à base de dados no final de todos os testes
afterAll(async () => {
    await mongoose.connection.close();
});


// --- O Teste ---
describe('Testes de Autenticação - POST /api/login', () => {

    it('deve fazer o login de um utilizador existente e retornar um token', async () => {
        // 1. Setup: Criar um utilizador de teste na base de dados
        const testUser = {
            nome: 'Test',
            sobrenome: 'User',
            email: 'test@example.com',
            password: 'Password123!',
            isEmailVerified: true,
        };
        await request(app).post('/api/register').send(testUser); // Usamos a rota de registo para criar o utilizador já com a senha encriptada

        // 2. Ação: Fazer o pedido de login
        const res = await request(app)
            .post('/api/login')
            .send({
                identifier: 'test@example.com',
                password: 'Password123!'
            });

        // 3. Verificação (Assert): Verificar se a resposta está correta
        expect(res.statusCode).toEqual(200); // Esperamos um status 200 (OK)
        expect(res.body).toHaveProperty('token'); // Esperamos que a resposta tenha uma propriedade 'token'
    });

    it('deve retornar erro 401 para credenciais inválidas', async () => {
        // 1. Setup: (Opcional) Criar um utilizador para garantir que a falha não é por base de dados vazia
         const testUser = {
            nome: 'Test',
            email: 'test2@example.com',
            password: 'Password123!',
            isEmailVerified: true,
        };
        await request(app).post('/api/register').send(testUser);

        // 2. Ação: Tentar fazer login com uma senha errada
        const res = await request(app)
            .post('/api/login')
            .send({
                identifier: 'test2@example.com',
                password: 'wrongpassword'
            });

        // 3. Verificação (Assert):
        expect(res.statusCode).toEqual(401); // Esperamos um status 401 (Não Autorizado)
        expect(res.body.message).toBe('Credenciais inválidas.'); // Verificamos a mensagem de erro
    });
});