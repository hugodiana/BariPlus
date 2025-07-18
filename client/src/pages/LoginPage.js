import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

const LoginPage = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Estados para Login
    const [identifier, setIdentifier] = useState('');
    
    // Estados para Cadastro
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    
    // Estados Comuns
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Estado para "Esqueci a Senha"
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    // NOVIDADE: Estado para aceitar os termos
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isRegistering && !acceptedTerms) {
            toast.error("Você precisa de aceitar os Termos de Serviço para se cadastrar.");
            return;
        }

        const url = isRegistering ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
        const body = isRegistering 
            ? { nome, sobrenome, username, email, password } 
            : { identifier, password };
            
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Algo deu errado.');
            
            if (isRegistering) {
                toast.success('Cadastro realizado com sucesso! Faça o login para continuar.');
                setIsRegistering(false);
            } else {
                localStorage.setItem('bariplus_token', data.token);
                window.location.href = '/'; 
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
  
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await response.json();
            toast.info(data.message);
            setIsForgotModalOpen(false);
            setForgotEmail('');
        } catch (error) {
            toast.error("Erro ao conectar com o servidor. Tente novamente.");
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <div className="login-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                    <h2>{isRegistering ? 'Crie a sua Conta' : 'Acesse a sua Conta'}</h2>
                    <p>Organize sua jornada pré e pós-bariátrica.</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                            <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
                            <input type="text" placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </>
                    )}
                    {!isRegistering && (
                        <input type="text" placeholder="E-mail ou Username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                    )}
                    
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                    </div>

                    {isRegistering && (
                        <div className="terms-container">
                           <label>
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms} 
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                Eu li e concordo com os <Link to="/termos" target="_blank">Termos de Serviço</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.
                           </label>
                        </div>
                    )}

                    <button type="submit" className="submit-button" disabled={isRegistering && !acceptedTerms}>
                        {isRegistering ? 'Cadastrar' : 'Entrar'}
                    </button>
                    
                    <div className="form-footer">
                        {!isRegistering && (
                            <button type="button" className="link-button" onClick={() => setIsForgotModalOpen(true)}>
                                Esqueci a minha senha
                            </button>
                        )}
                        <button type="button" className="link-button" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
                        </button>
                    </div>
                </form>
            </div>

            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                {/* ... (código do modal de esqueci a senha) ... */}
            </Modal>
        </div>
    );
};

export default LoginPage;