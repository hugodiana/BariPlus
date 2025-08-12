import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './AdminLoginPage.css';
import logo from '../logo.svg';

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Limpa o erro ao digitar
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            // ✅ CORREÇÃO: Aponta para a nova rota de login de admin
            const response = await fetch(`${apiUrl}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha no login.');
            }

            toast.success('Login realizado com sucesso!');
            localStorage.setItem('bariplus_admin_token', data.token);
            window.location.href = '/'; // Redireciona para o dashboard do admin
            
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Ocorreu um erro durante o login.');
            toast.error(err.message || 'Ocorreu um erro durante o login.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-box">
                <img src={logo} alt="BariPlus Logo" className="login-logo-admin" />
                <h2>Painel de Administração</h2>
                
                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="input-group">
                        <label htmlFor="identifier">Email ou Username</label>
                        <input
                            id="identifier" type="text" name="identifier"
                            value={formData.identifier} onChange={handleChange}
                            required disabled={isSubmitting}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <div className="password-input">
                            <input
                                id="password" type={showPassword ? 'text' : 'password'} name="password"
                                value={formData.password} onChange={handleChange}
                                required disabled={isSubmitting}
                            />
                            <button
                                type="button" className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isSubmitting}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn-admin" disabled={isSubmitting}>
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;