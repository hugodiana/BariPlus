import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Importar useNavigate
import { toast } from 'react-toastify';
import './AdminLoginPage.css'; // Vamos usar um CSS dedicado

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate(); // 2. Inicializar o hook

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const response = await fetch(`${apiUrl}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha no login. Verifique suas credenciais.');
            }

            toast.success('Login realizado com sucesso!');
            localStorage.setItem('bariplus_admin_token', data.token);
            
            // 3. Usar navigate para um redirecionamento suave
            navigate('/dashboard'); 
            
        } catch (err) {
            console.error('Login error:', err);
            toast.error(err.message || 'Ocorreu um erro durante o login.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="login-card">
                <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                <h2>Painel de Administração</h2>
                
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="identifier">Email ou Username</label>
                        <input
                            id="identifier"
                            type="text"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <button type="submit" className="primary-btn login-btn" disabled={isSubmitting}>
                        {isSubmitting && <span className="btn-spinner"></span>}
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;