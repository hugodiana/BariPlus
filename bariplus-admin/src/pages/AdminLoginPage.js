// src/pages/AdminLoginPage.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { setAdminToken } from '../utils/api';
import './AdminPages.css'; 


const AdminLoginPage = ({ onLoginSuccess }) => {
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setAdminToken(data.token);
            onLoginSuccess();
            toast.success("Login de administrador bem-sucedido!");
        } catch (error) {
            toast.error(error.message || "Credenciais inválidas ou acesso negado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <h2>Painel de Administração</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <input type="text" name="identifier" placeholder="Email ou Username" value={form.identifier} onChange={handleInputChange} required />
                    <input type="password" name="password" placeholder="Senha" value={form.password} onChange={handleInputChange} required />
                    <button type="submit" className="submit-button" disabled={isLoading}>
                        {isLoading ? 'A entrar...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;