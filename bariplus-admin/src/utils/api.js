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

        if ([401, 403].includes(response.status)) {
            setAuthToken(null);
            toast.error('Sessão expirada. Por favor, faça o login novamente.');
            window.location.href = '/login'; 
            throw new Error('Sessão expirada');
        }

        if (response.status === 204) {
            return; // Retorna undefined para respostas sem conteúdo (ex: DELETE)
        }
        
        const data = await response.json();

        if (!response.ok) {
            // Se a API enviar um objeto de erro com uma mensagem, use-a. Senão, use o status.
            throw new Error(data.message || `Erro: ${response.statusText}`);
        }

        return data; // Retorna os dados JSON diretamente em caso de sucesso

    } catch (error) {
        return Promise.reject(error);
    }
};