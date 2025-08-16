import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

// ✅ CORREÇÃO: A chave do token foi alterada para 'bariplus_admin_token'
const TOKEN_KEY = 'bariplus_admin_token';

// A função agora lê o token do localStorage sempre que é chamada,
// garantindo que ele esteja sempre atualizado.
const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
};

export const fetchApi = async (endpoint, options = {}) => {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // Se o token for inválido, o servidor retornará 401 ou 403
        if ([401, 403].includes(response.status)) {
            setAuthToken(null); // Limpa o token inválido
            toast.error('Sessão expirada ou acesso negado. Por favor, faça o login novamente.');
            
            // Redireciona para a página de login do admin
            window.location.href = '/login'; 
            
            throw new Error('Sessão expirada');
        }

        return response;

    } catch (error) {
        // Evita mostrar a mesma mensagem de erro duas vezes
        if (error.message !== 'Sessão expirada') {
            toast.error(error.message || "Erro de conexão com a API.");
        }
        return Promise.reject(error);
    }
};