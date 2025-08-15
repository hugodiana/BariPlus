// src/utils/api.js
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

// Guarda o token na memória para segurança.
let accessToken = localStorage.getItem('bariplus_token');

// Função para definir/limpar o token
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('bariplus_token', token);
        accessToken = token;
    } else {
        localStorage.removeItem('bariplus_token');
        accessToken = null;
    }
};

// A nossa função fetch "inteligente" e centralizada
export const fetchApi = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // Se o token expirar (erro 401/403), desloga o utilizador.
        // A lógica de refresh token pode ser adicionada aqui no futuro se necessário.
        if ([401, 403].includes(response.status)) {
            setAuthToken(null); // Limpa o token inválido
            toast.error('Sessão expirada. Por favor, faça o login novamente.');
            // Força o recarregamento da página para o ecrã de login
            window.location.href = '/login'; 
            // Lança um erro para interromper a execução do código que chamou a função
            throw new Error('Sessão expirada');
        }

        return response;

    } catch (error) {
        // Se a chamada de rede falhar, rejeita a promessa
        return Promise.reject(error);
    }
};