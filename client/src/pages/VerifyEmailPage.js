import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const VerifyPage = () => {
    const { token } = useParams();
    const navigate = useNavigate(); // Hook para o redirecionamento
    const [message, setMessage] = useState('A verificar o seu e-mail...');
    const [isSuccess, setIsSuccess] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setMessage("Token de verificação não encontrado.");
                return;
            }
            try {
                const res = await fetch(`${apiUrl}/api/verify-email/${token}`);
                if (!res.ok) {
                    // Tenta ler a mensagem de erro do back-end, se houver
                    const errorText = await res.text();
                    throw new Error(errorText || "Link inválido ou expirado.");
                }
                
                setIsSuccess(true);
                setMessage("E-mail verificado com sucesso! A redirecionar para o login...");

                // ✅ CORREÇÃO: Redireciona para a página de login após 3 segundos
                setTimeout(() => {
                    navigate('/login?verified=true');
                }, 3000);

            } catch (error) {
                setIsSuccess(false);
                setMessage(error.message || "Link de verificação inválido ou expirado.");
            }
        };
        verifyToken();
    }, [token, apiUrl, navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            {message === 'A verificar o seu e-mail...' ? (
                <LoadingSpinner />
            ) : (
                <>
                    <h2 style={{ color: isSuccess ? '#28a745' : '#c0392b' }}>
                        {isSuccess ? 'Sucesso!' : 'Erro na Verificação'}
                    </h2>
                    <p>{message}</p>
                    {!isSuccess && <Link to="/login">Voltar para o Login</Link>}
                </>
            )}
        </div>
    );
};

export default VerifyEmailPage;