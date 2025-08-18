// src/utils/api.js
import { toast } from 'react-toastify';

// IMPORTANTE: Aponte para a mesma URL de API do seu backend
const API_URL = process.env.REACT_APP_API_URL || 'https://bariplus-api-vzk6.onrender.com';

let accessToken = localStorage.getItem('nutri_token');

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('nutri_token', token);
        accessToken = token;
    } else {
        localStorage.removeItem('nutri_token');
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
            return;
        }
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Erro: ${response.statusText}`);
        }

        return data;

    } catch (error) {
        return Promise.reject(error);
    }
};