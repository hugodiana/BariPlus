import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

// Guarda o accessToken na memória. É mais seguro que o localStorage.
let accessToken = null;

// Função para definir o token, chamada após o login
export const setAuthToken = (token) => {
    accessToken = token;
};

// A nossa nova função fetch "inteligente"
export const fetchWithAuth = async (endpoint, options = {}) => {
    // 1. Pega o token atual e prepara os headers
    const token = accessToken;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Tenta fazer o pedido original
    let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    // 3. Se a resposta for 401 (Token Expirado), tenta renovar o token
    if (response.status === 401) {
        try {
            console.log("Access Token expirado. A tentar renovar...");
            const refreshResponse = await fetch(`${API_URL}/api/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // O cookie httpOnly com o refresh token é enviado automaticamente pelo navegador
            });

            if (!refreshResponse.ok) {
                // Se a renovação falhar, desloga o usuário
                throw new Error('Sessão expirada. Por favor, faça o login novamente.');
            }

            const { accessToken: newAccessToken } = await refreshResponse.json();
            setAuthToken(newAccessToken); // Atualiza o novo token na memória

            // 4. Tenta o pedido original novamente com o novo token
            console.log("Token renovado com sucesso. A tentar o pedido original novamente...");
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        } catch (error) {
            // Se a renovação falhar, limpa tudo e redireciona para o login
            setAuthToken(null);
            toast.error(error.message);
            window.location.href = '/login';
            return Promise.reject(error);
        }
    }

    return response;
};

export default fetchWithAuth;