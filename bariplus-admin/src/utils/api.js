// src/utils/api.js
// A importação do 'toast' foi removida, pois não é usada neste ficheiro.

const API_URL = process.env.REACT_APP_API_URL || 'https://bariplus-api-vzk6.onrender.com';
let adminToken = localStorage.getItem('admin_token');

export const setAdminToken = (token) => {
    if (token) {
        localStorage.setItem('admin_token', token);
        adminToken = token;
    } else {
        localStorage.removeItem('admin_token');
        adminToken = null;
    }
};

export const fetchAdminApi = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if ([401, 403].includes(response.status)) {
            setAdminToken(null);
            window.location.href = '/login';
            throw new Error('Acesso negado ou sessão expirada.');
        }
        // A verificação de !response.ok agora acontece depois de tentar ler o JSON
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro no servidor.');
        }
        return data;
    } catch (error) {
        return Promise.reject(error);
    }
};