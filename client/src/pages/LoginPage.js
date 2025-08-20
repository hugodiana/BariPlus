// client/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { fetchApi, setAuthToken } from '../utils/api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await fetchApi('/api/login', {
                method: 'POST',
                body: JSON.stringify({ identifier: form.identifier, password: form.password }),
            });
            
            setAuthToken(data.token);
            onLoginSuccess(data.user); // Passa os dados do utilizador para o App.js
            navigate('/'); // Navega para o destino correto
            
        } catch (error) {
            toast.error(error.message || "Credenciais inválidas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await response.json();
            toast.info(data.message || 'Se este e-mail estiver cadastrado, enviaremos as instruções.');
            setIsForgotModalOpen(false);
            setForgotEmail('');
        } catch {
            toast.error("Erro ao conectar com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                    <h2>Acesse a sua Conta</h2>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input type="text" name="identifier" placeholder="E-mail ou Username" value={form.identifier} onChange={handleInputChange} required />
                    <input type="password" name="password" placeholder="Senha" value={form.password} onChange={handleInputChange} required />
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? 'A entrar...' : 'Entrar'}
                    </button>
                    <div className="form-footer">
                        <button type="button" className="link-button" onClick={() => setIsForgotModalOpen(true)}>
                            Esqueci a minha senha
                        </button>
                        <Link to="/register" className="link-button">
                            Não tem uma conta? Cadastre-se
                        </Link>
                    </div>
                </form>
            </div>
            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                <h2>Redefinir Senha</h2>
                <p>Digite o seu e-mail de cadastro e enviaremos um link para você criar uma nova senha.</p>
                <form onSubmit={handleForgotPassword} className="modal-form">
                    <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu-email@exemplo.com"
                        required
                    />
                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={() => setIsForgotModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? 'A enviar...' : 'Enviar Link'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LoginPage;