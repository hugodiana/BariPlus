import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css'; // Reutilizando estilos

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValidToken, setIsValidToken] = useState(false);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${apiUrl}/api/validate-reset-token/${token}`);
                if (!response.ok) throw new Error();
                setIsValidToken(true);
            } catch (error) {
                toast.error('Link para redefinir senha é inválido ou expirou.');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        checkToken();
    }, [token, navigate, apiUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }
        try {
            const response = await fetch(`${apiUrl}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success('Senha redefinida com sucesso! Por favor, faça o login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || "Erro ao redefinir senha.");
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>A verificar o link...</div>;
    }

    // Só renderiza o formulário se o token for válido
    if (!isValidToken) {
        return null; // Ou uma mensagem de erro, mas já estamos a redirecionar
    }

    return (
        <div className="login-page-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Crie sua Nova Senha</h2>
                <input type="password" placeholder="Nova Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type="password" placeholder="Confirme a Nova Senha" value={confirmPassword