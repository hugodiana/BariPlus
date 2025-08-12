import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './LoginPage.css';

const LoginPage = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        identifier: '', nome: '', sobrenome: '', username: '', email: '',
        confirmEmail: '', password: '', confirmPassword: ''
    });

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            toast.success("E-mail verificado! Por favor, faça o login.");
        }
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({...prev, [name]: value}));
        if (isRegistering && name === 'password') {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (isRegistering) {
            if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
                toast.error("Os e-mails não coincidem.");
                setIsLoading(false);
                return;
            }
            if (form.password !== form.confirmPassword) {
                toast.error("As senhas não coincidem.");
                setIsLoading(false);
                return;
            }
            if (!validatePassword(form.password)) {
                toast.error("A sua senha não cumpre todos os requisitos de segurança.");
                setIsLoading(false);
                return;
            }
            if (!acceptedTerms) {
                toast.error("Você precisa de aceitar os Termos de Serviço.");
                setIsLoading(false);
                return;
            }
        }

        const url = isRegistering ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
        const body = isRegistering
            ? { nome: form.nome, sobrenome: form.sobrenome, username: form.username, email: form.email, password: form.password }
            : { identifier: form.identifier, password: form.password };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro desconhecido.');

            if (isRegistering) {
                toast.success('Cadastro quase concluído! Verifique o seu e-mail.');
                navigate('/verify-email', { state: { email: form.email } });
            } else {
                toast.success("Login bem-sucedido!");
                onLoginSuccess(data);
            }
        } catch (error) {
            toast.error(error.message);
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
                    <h2>{isRegistering ? 'Crie a sua Conta' : 'Acesse a sua Conta'}</h2>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegistering ? (
                        <>
                            <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleInputChange} required />
                            <input type="text" name="sobrenome" placeholder="Sobrenome" value={form.sobrenome} onChange={handleInputChange} required />
                            <input type="text" name="username" placeholder="Nome de usuário" value={form.username} onChange={handleInputChange} required />
                            <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleInputChange} required />
                            <input type="email" name="confirmEmail" placeholder="Confirme seu E-mail" value={form.confirmEmail} onChange={handleInputChange} required />
                            <div className="password-wrapper">
                                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Senha" value={form.password} onChange={handlePasswordChange} required />
                                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                            </div>
                            <PasswordStrengthIndicator validations={passwordValidations} />
                            <div className="password-wrapper">
                                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirme sua Senha" value={form.confirmPassword} onChange={handleInputChange} required />
                            </div>
                            <div className="terms-container">
                                <label>
                                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                                     Eu li e concordo com os <Link to="/termos" target="_blank" rel="noopener noreferrer">Termos de Serviço</Link> e a <Link to="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.
                                </label>
                            </div>
                        </>
                    ) : (
                        <>
                            <input type="text" name="identifier" placeholder="E-mail ou Username" value={form.identifier} onChange={handleInputChange} required />
                            <div className="password-wrapper">
                                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Senha" value={form.password} onChange={handleInputChange} required />
                                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
                            </div>
                        </>
                    )}
                    <button type="submit" className="submit-button" disabled={isLoading || (isRegistering && !acceptedTerms)}>
                        {isLoading ? 'Aguarde...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
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
            </div> {/* ✅ A DIV DE FECHO QUE ESTAVA EM FALTA FOI ADICIONADA AQUI */}
            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                <div className="modal-header">
                    <h2>Redefinir Senha</h2>
                    <p>Digite o seu e-mail de cadastro e enviaremos um link para você criar uma nova senha.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="forgot-email">E-mail</label>
                        <input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="seu-email@exemplo.com"
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="secondary-btn" 
                            onClick={() => setIsForgotModalOpen(false)}
                        >
                            Cancelar
                        </button>
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