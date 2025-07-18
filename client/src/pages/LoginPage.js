import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import Modal from '../components/Modal';

const LoginPage = () => {
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    // Estado para a validação da senha em tempo real
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
    });

    // Efeito que observa a senha e atualiza as validações
    useEffect(() => {
        if (isRegistering) {
            setPasswordValidation({
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
            });
        }
    }, [password, isRegistering]);


    const handleUsernameChange = (e) => {
        const value = e.target.value.toLowerCase().replace(/\s/g, '');
        setUsername(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (isRegistering) {
            if (password !== confirmPassword) return setMessage("As senhas não coincidem.");
            const allValid = Object.values(passwordValidation).every(v => v);
            if (!allValid) return setMessage("A sua senha não cumpre todos os requisitos.");
            if (!termsAccepted) return setMessage("Você precisa de aceitar os Termos de Serviço.");
        }

        const apiUrl = process.env.REACT_APP_API_URL;
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
                setMessage('Cadastro realizado com sucesso! Faça o login para continuar.');
                setIsRegistering(false);
            } else {
                localStorage.setItem('bariplus_token', data.token);
                window.location.href = '/';
            }
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        // ... (sua função handleForgotPassword continua igual)
    };

    return (
        <div className="login-page-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                    <p>Organize sua jornada pré e pós-bariátrica.</p>
                </div>
                <h2>{isRegistering ? 'Criar Conta' : 'Acessar Conta'}</h2>

                {isRegistering && (
                    <>
                        <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
                        <input type="text" placeholder="Nome de usuário (sem espaços)" value={username} onChange={handleUsernameChange} required />
                        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </>
                )}

                {!isRegistering && (
                    <input type="text" placeholder="E-mail ou Username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                )}

                <div className="password-wrapper">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                </div>

                {isRegistering && (
                    <>
                        <div className="password-strength-meter">
                            <div className={passwordValidation.length ? 'valid' : 'invalid'}>✓ Pelo menos 8 caracteres</div>
                            <div className={passwordValidation.uppercase ? 'valid' : 'invalid'}>✓ Uma letra maiúscula</div>
                            <div className={passwordValidation.lowercase ? 'valid' : 'invalid'}>✓ Uma letra minúscula</div>
                            <div className={passwordValidation.number ? 'valid' : 'invalid'}>✓ Pelo menos um número</div>
                        </div>
                        <div className="password-wrapper">
                            <input type={showPassword ? 'text' : 'password'} placeholder="Confirme a Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                        <div className="terms-container">
                            <input type="checkbox" id="terms" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} />
                            <label htmlFor="terms">Eu li e aceito os <Link to="/termos" target="_blank">Termos de Serviço</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.</label>
                        </div>
                    </>
                )}

                <button type="submit" className="submit-button">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
                {message && <p className="message">{message}</p>}

                <div className="form-footer">
                    <button type="button" className="link-button" onClick={() => setIsForgotModalOpen(true)}>
                        Esqueci a minha senha
                    </button>
                    <button type="button" className="link-button" onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
                    </button>
                </div>
            </form>

            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                {/* ... (seu modal de esqueci a senha) ... */}
            </Modal>
        </div>
    );
};

export default LoginPage;