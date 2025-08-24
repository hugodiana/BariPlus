// client/src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import './LoginPage.css'; // Reutilizando o mesmo estilo

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await fetchApi('/api/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            toast.success(data.message);
            setMessageSent(true);
        } catch (error) {
            toast.error(error.message || 'Ocorreu um erro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <Link to="/landing">
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                    </Link>
                    <h2>Recuperar Senha</h2>
                </div>
                {messageSent ? (
                    <div className="form-success-message">
                        <p>Verifique a sua caixa de entrada (e a pasta de spam) para encontrar o link de redefinição de senha.</p>
                        <Link to="/login" className="form-footer-link">Voltar para o Login</Link>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <p className="form-description">
                            Não se preocupe! Insira o seu e-mail abaixo e nós enviaremos um link para você criar uma nova senha.
                        </p>
                        <input
                            type="email"
                            name="email"
                            placeholder="Seu e-mail de cadastro"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? 'A enviar...' : 'Enviar Link de Recuperação'}
                        </button>
                        <div className="form-footer">
                            <Link to="/login">Lembrou-se da senha? Faça login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;