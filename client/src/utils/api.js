// src/utils/api.js
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;
let accessToken = localStorage.getItem('bariplus_token');

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
        if ([401, 403].includes(response.status)) {
            setAuthToken(null);
            toast.error('Sessão expirada. Por favor, faça o login novamente.');
            window.location.href = '/login'; 
            throw new Error('Sessão expirada');
        }

        // --- MELHORIA APLICADA AQUI ---

        // Se a resposta NÃO for bem-sucedida, tenta extrair a mensagem de erro do JSON
        if (!response.ok) {
            const errorData = await response.json();
            // Lança um erro com a mensagem vinda do backend
            throw new Error(errorData.message || `Erro: ${response.statusText}`);
        }

        // Se a resposta for bem-sucedida, já retorna o JSON processado
        // (A menos que seja uma resposta sem conteúdo, como um status 204 de um DELETE)
        if (response.status === 204) {
            return; // Retorna undefined para respostas sem conteúdo
        }
        return response.json();

    } catch (error) {
        // Se a chamada de rede falhar ou se um erro for lançado acima, rejeita a promessa
        return Promise.reject(error);
    }
};