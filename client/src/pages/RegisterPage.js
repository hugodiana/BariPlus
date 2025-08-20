// client/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './LoginPage.css'; // Reutilizando os estilos

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        nome: '', sobrenome: '', username: '', email: '',
        confirmEmail: '', password: '', confirmPassword: ''
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'password') {
            validatePassword(value);
        }
    };

    const validatePassword = (pass) => {
        const validations = {
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
            return toast.error("Os e-mails não coincidem.");
        }
        if (form.password !== form.confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }
        if (!validatePassword(form.password)) {
            return toast.error("A sua senha não cumpre todos os requisitos de segurança.");
        }
        if (!acceptedTerms) {
            return toast.error("Você precisa de aceitar os Termos de Serviço.");
        }

        setIsLoading(true);
        const body = { 
            nome: form.nome, 
            sobrenome: form.sobrenome, 
            username: form.username, 
            email: form.email, 
            password: form.password 
        };

        try {
            const response = await fetch(`${apiUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro desconhecido.');

            toast.success('Cadastro quase concluído! Verifique o seu e-mail para ativar a sua conta.');
            // Navega para uma página genérica que informa o utilizador para verificar o e-mail.
            // Poderíamos criar uma página específica para isto se quiséssemos.
            navigate('/login'); 
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                    <h2>Crie a sua Conta</h2>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleInputChange} required />
                    <input type="text" name="sobrenome" placeholder="Sobrenome" value={form.sobrenome} onChange={handleInputChange} required />
                    <input type="text" name="username" placeholder="Nome de usuário" value={form.username} onChange={handleInputChange} required />
                    <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleInputChange} required />
                    <input type="email" name="confirmEmail" placeholder="Confirme seu E-mail" value={form.confirmEmail} onChange={handleInputChange} required />
                    <input type="password" name="password" placeholder="Senha" value={form.password} onChange={handleInputChange} required />
                    <PasswordStrengthIndicator validations={passwordValidations} />
                    <input type="password" name="confirmPassword" placeholder="Confirme sua Senha" value={form.confirmPassword} onChange={handleInputChange} required />
                    <div className="terms-container">
                        <label>
                            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                            Eu li e concordo com os <Link to="/termos" target="_blank">Termos</Link> e <Link to="/privacidade" target="_blank">Privacidade</Link>.
                        </label>
                    </div>
                    <button type="submit" className="submit-button" disabled={isLoading || !acceptedTerms}>
                        {isLoading ? 'Aguarde...' : 'Cadastrar'}
                    </button>
                    <div className="form-footer">
                        <Link to="/login">Já tem uma conta? Faça login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;