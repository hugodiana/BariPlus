import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Reutilizando os estilos da página de login

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const { userId, token } = useParams(); // Pega os parâmetros da URL
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage("As senhas não coincidem.");
            return;
        }
        setMessage('');
        const apiUrl = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${apiUrl}/api/reset-password/${userId}/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage("Senha redefinida com sucesso! Você será redirecionado para o login.");
            setTimeout(() => {
                navigate('/login');
            }, 3000); // Redireciona após 3 segundos

        } catch (error) {
            setMessage(error.message || "Link inválido ou expirado. Tente novamente.");
        }
    };

    return (
        <div className="login-page-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Crie sua Nova Senha</h2>
                <input
                    type="password"
                    placeholder="Nova Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirme a Nova Senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit" className="submit-button">Redefinir Senha</button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
};

export default ResetPasswordPage;