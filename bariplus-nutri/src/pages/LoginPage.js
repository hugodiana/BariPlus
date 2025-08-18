import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchApi, setAuthToken } from '../utils/api';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ email: '', senha: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await fetchApi('/api/nutri/auth/login', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setAuthToken(data.token);
            onLoginSuccess(data.nutricionista);
            toast.success("Login bem-sucedido!");
        } catch (error) {
            toast.error(error.message || "Credenciais inválidas.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                    <h2>Portal do Nutricionista</h2>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleInputChange} required />
                    <input type="password" name="senha" placeholder="Senha" value={form.senha} onChange={handleInputChange} required />
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? 'A entrar...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;