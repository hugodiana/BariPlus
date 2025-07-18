import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LoginPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

const LoginPage = () => {
    // ... (estados de login e estados comuns)
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Estados para Cadastro
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState(''); // ✅ NOVO
    const [confirmPassword, setConfirmPassword] = useState(''); // ✅ NOVO
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Estado para validação de senha forte
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });

    const apiUrl = process.env.REACT_APP_API_URL;

    // Função para validar a senha
    const validatePassword = (pass) => { /* ... (código existente) */ };
    const handlePasswordChange = (e) => { /* ... (código existente) */ };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isRegistering) {
            // ✅ NOVO: Validações de confirmação para o cadastro
            if (password !== confirmPassword) {
                return toast.error("As senhas não coincidem.");
            }
            if (email !== confirmEmail) {
                return toast.error("Os e-mails não coincidem.");
            }
            if (!validatePassword(password)) {
                return toast.error("A sua senha não cumpre todos os requisitos de segurança.");
            }
            if (!acceptedTerms) {
                return toast.error("Você precisa de aceitar os Termos de Serviço.");
            }
        }

        const url = isRegistering ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
        const body = isRegistering 
            ? { nome, sobrenome, username, email, password } 
            : { identifier, password };
            
        try {
            // ... (lógica de fetch existente)
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
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                            <input type="text" placeholder="Sobrenome" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} required />
                            <input type="text" placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            {/* ✅ NOVO: Campo de confirmação de e-mail */}
                            <input type="email" placeholder="Confirme seu E-mail" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
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
                            onChange={handlePasswordChange} 
                            required 
                        />
                        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                    </div>

                    {isRegistering && (
                        <>
                             {/* ✅ NOVO: Campo de confirmação de senha */}
                            <div className="password-wrapper">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirme sua Senha" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="password-requirements">
                                <ul>
                                    <li className={passwordValidations.length ? 'valid' : 'invalid'}>Pelo menos 8 caracteres</li>
                                    <li className={passwordValidations.uppercase ? 'valid' : 'invalid'}>Uma letra maiúscula</li>
                                    <li className={passwordValidations.number ? 'valid' : 'invalid'}>Um número</li>
                                    <li className={passwordValidations.specialChar ? 'valid' : 'invalid'}>Um caractere especial</li>
                                </ul>
                            </div>

                            <div className="terms-container">
                               <label>
                                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                                    Eu li e concordo com os <Link to="/termos" target="_blank">Termos de Serviço</Link> e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.
                               </label>
                            </div>
                        </>
                    )}

                    <button type="submit" className="submit-button" disabled={isRegistering && !acceptedTerms}>
                        {isRegistering ? 'Cadastrar' : 'Entrar'}
                    </button>
                    
                    <div className="form-footer">
                        {!isRegistering && ( <button type="button" className="link-button" onClick={() => setIsForgotModalOpen(true)}>Esqueci a minha senha</button> )}
                        <button type="button" className="link-button" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ✅ CORREÇÃO: Conteúdo do Modal adicionado */}
            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                <h2>Redefinir Senha</h2>
                <p>Digite o seu e-mail de cadastro e enviaremos um link para você criar uma nova senha.</p>
                <form onSubmit={handleForgotPassword} className="modal-form">
                    <label>E-mail</label>
                    <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu-email@exemplo.com"
                        required
                    />
                    <button type="submit" className="submit-button">Enviar Link de Redefinição</button>
                </form>
            </Modal>
        </div>
    );
};

export default LoginPage;