import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Adiciona o token de autenticação a todas as requisições, se ele existir
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bariplus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;