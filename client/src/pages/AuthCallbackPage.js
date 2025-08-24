// client/src/pages/AuthCallbackPage.js
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchApi, setAuthToken } from '../utils/api'; // ✅ 1. IMPORTAR AS FUNÇÕES CORRETAS

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            const verifyTokenAndLogin = async () => {
                try {
                    // ✅ 2. DEFINIR O TOKEN ANTES DE FAZER A CHAMADA
                    localStorage.setItem('bariplus_token', token);
                    setAuthToken(token);

                    // ✅ 3. USAR A FUNÇÃO fetchApi EM VEZ DO fetch NATIVO
                    const userData = await fetchApi('/api/me');
                    
                    login(userData, token);

                    toast.success('Login com Google bem-sucedido!');
                    
                    if (!userData.onboardingCompleto) {
                        navigate('/onboarding', { replace: true });
                    } else {
                        navigate('/', { replace: true });
                    }

                } catch (error) {
                    toast.error(error.message || 'Não foi possível verificar os dados do usuário.');
                    logout();
                    navigate('/login', { replace: true });
                }
            };

            verifyTokenAndLogin();
        } else {
            toast.error("Falha na autenticação com o Google.");
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, login, logout]);

    return <LoadingSpinner fullPage message="Finalizando autenticação..." />;
};

export default AuthCallbackPage;