import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const LoginPage = () => {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });

    const apiUrl = process.env.REACT_APP_API_URL;

    const validatePassword = (pass) => {
        const validations = {
            length: pass.length >= 8, uppercase: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass), specialChar: /[!@#$%^&*(),.?":{}|<>*]/.test(pass),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handlePasswordChange = (e) => {
        const newPass = e.target.value;
        setPassword(newPass);
        if (isRegistering) {
            validatePassword(newPass);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRegistering) {
            if (email.toLowerCase() !== confirmEmail.toLowerCase()) return toast.error("Os e-mails não coincidem.");
            if (password !== confirmPassword) return toast.error("As senhas não coincidem.");
            if (!validatePassword(password)) return toast.error("A sua senha não cumpre todos os requisitos de segurança.");
            if (!acceptedTerms) return toast.error("Você precisa de aceitar os Termos de Serviço.");
        }
        const url = isRegistering ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
        const body = isRegistering ? { nome, sobrenome, username, email, password } : { identifier, password };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Algo deu errado.');
            
            if (isRegistering) {
                toast.success('Cadastro quase concluído! Verifique o seu e-mail.');
                navigate('/verify-email', { state: { email: email } });
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
            toast.error("Erro ao conectar com o servidor.");
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <div className="login-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                    <h2>{isRegistering ? 'Crie a sua Conta' : 'Acesse a sua Conta'}</h2>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegistering ? (
                        <>
                            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                            <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
                            <input type="text" placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="email" placeholder="Confirme seu E-mail" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
                        </>
                    ) : (
                        <input type="text" placeholder="E-mail ou Username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                    )}
                    <div className="password-wrapper">
                        <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={handlePasswordChange} required />
                        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                    </div>
                    {isRegistering && (
                        <>
                            <div className="password-wrapper">
                                <input type={showPassword ? 'text' : 'password'} placeholder="Confirme sua Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <PasswordStrengthIndicator validations={passwordValidations} />
                            <div className="terms-container">
                               <label>
                                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                                    Eu li e concordo com os <Link to="/termos" target="_blank" rel="noopener noreferrer">Termos de Serviço</Link> e a <Link to="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.
                               </label>
                            </div>
                        </>
                    )}
                    <button type="submit" className="submit-button" disabled={isRegistering && !acceptedTerms}>{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
                    <div className="form-footer">
                        {!isRegistering && (<button type="button" className="link-button" onClick={() => setIsForgotModalOpen(true)}>Esqueci a minha senha</button>)}
                        <button type="button" className="link-button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                <h2>Redefinir Senha</h2>
                <p>Digite o seu e-mail de cadastro e enviaremos um link para você criar uma nova senha.</p>
                <form onSubmit={handleForgotPassword} className="modal-form">
                    <label>E-mail</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="seu-email@exemplo.com" required />
                    <button type="submit" className="submit-button">Enviar Link de Redefinição</button>
                </form>
            </Modal>
        </div>
    );
};

export default LoginPage;