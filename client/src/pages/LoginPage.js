import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

const LoginPage = () => {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados do formulário
    const [formData, setFormData] = useState({
        identifier: '',
        nome: '',
        sobrenome: '',
        username: '',
        email: '',
        confirmEmail: '',
        password: '',
        confirmPassword: ''
    });
    
    // Estados da UI
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validatePassword = (pass) => {
        const validations = {
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            number: /\d/.test(pass),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handlePasswordChange = (e) => {
        const newPass = e.target.value;
        setPassword(newPass);
        // A validação visual ainda pode acontecer
        if (isRegistering) {
            validatePassword(newPass);
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (isRegistering) {
            if (formData.email.toLowerCase() !== formData.confirmEmail.toLowerCase()) {
                setIsLoading(false);
                return toast.error("Os e-mails não coincidem.");
            }
            if (formData.password !== formData.confirmPassword) {
                setIsLoading(false);
                return toast.error("As senhas não coincidem.");
            }
            if (!validatePassword(formData.password)) {
                setIsLoading(false);
                return toast.error("Sua senha não atende aos requisitos de segurança.");
            }
            if (!acceptedTerms) {
                setIsLoading(false);
                return toast.error("Você precisa aceitar os Termos de Serviço.");
            }
        }

        const url = isRegistering ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
        const body = isRegistering 
            ? { 
                nome: formData.nome,
                sobrenome: formData.sobrenome,
                username: formData.username,
                email: formData.email,
                password: formData.password
              } 
            : { identifier: formData.identifier, password: formData.password };
            
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro ao processar sua solicitação.');
            }
            
            if (isRegistering) {
                toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
                setIsRegistering(false);
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                localStorage.setItem('bariplus_token', data.token);
                navigate('/');
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
                body: JSON.stringify({ email: formData.email }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Não foi possível enviar o e-mail de recuperação.');
            }
            
            toast.success(data.message || 'E-mail de recuperação enviado com sucesso!');
            setIsForgotModalOpen(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <div className="login-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                    <h2>{isRegistering ? 'Crie sua Conta' : 'Acesse sua Conta'}</h2>
                    <p>{isRegistering ? 'Preencha os dados para se cadastrar' : 'Informe seus dados para entrar'}</p>
                </div>
                
                <form className="login-form" onSubmit={handleSubmit}>
                    {isRegistering ? (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <input 
                                        type="text" 
                                        name="nome"
                                        placeholder="Nome" 
                                        value={formData.nome} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <input 
                                        type="text" 
                                        name="sobrenome"
                                        placeholder="Sobrenome" 
                                        value={formData.sobrenome} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="username"
                                    placeholder="Nome de usuário" 
                                    value={formData.username} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="email"
                                    placeholder="E-mail" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="confirmEmail"
                                    placeholder="Confirme seu E-mail" 
                                    value={formData.confirmEmail} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <input 
                                type="text" 
                                name="identifier"
                                placeholder="E-mail ou Nome de usuário" 
                                value={formData.identifier} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    )}
                    
                    <div className="form-group password-group">
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Senha" 
                            value={formData.password} 
                            onChange={handlePasswordChange} 
                            required 
                        />
                        <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    {isRegistering && (
                        <>
                            <div className="form-group">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Confirme sua Senha" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            
                            <div className="password-requirements">
                                <h4>Requisitos da senha:</h4>
                                <ul>
                                    <li className={passwordValidations.length ? 'valid' : 'invalid'}>
                                        Pelo menos 8 caracteres
                                    </li>
                                    <li className={passwordValidations.uppercase ? 'valid' : 'invalid'}>
                                        Pelo menos 1 letra maiúscula
                                    </li>
                                    <li className={passwordValidations.number ? 'valid' : 'invalid'}>
                                        Pelo menos 1 número
                                    </li>
                                    <li className={passwordValidations.specialChar ? 'valid' : 'invalid'}>
                                        Pelo menos 1 caractere especial
                                    </li>
                                </ul>
                            </div>
                            
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
                        </>
                    )}

                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={(isRegistering && !acceptedTerms) || isLoading}
                    >
                        {isLoading ? (
                            <span className="loading-spinner"></span>
                        ) : isRegistering ? (
                            'Cadastrar'
                        ) : (
                            'Entrar'
                        )}
                    </button>
                    
                    <div className="form-footer">
                        {!isRegistering && (
                            <button 
                                type="button" 
                                className="link-button" 
                                onClick={() => setIsForgotModalOpen(true)}
                            >
                                Esqueci minha senha
                            </button>
                        )}
                        
                        <button 
                            type="button" 
                            className="link-button" 
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setFormData({
                                    identifier: '',
                                    nome: '',
                                    sobrenome: '',
                                    username: '',
                                    email: '',
                                    confirmEmail: '',
                                    password: '',
                                    confirmPassword: ''
                                });
                            }}
                        >
                            {isRegistering ? (
                                'Já tem uma conta? Faça login'
                            ) : (
                                'Não tem uma conta? Cadastre-se'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
                <div className="modal-content">
                    <h2>Redefinir Senha</h2>
                    <p>Digite seu e-mail de cadastro e enviaremos um link para criar uma nova senha.</p>
                    
                    <form onSubmit={handleForgotPassword} className="modal-form">
                        <div className="form-group">
                            <label htmlFor="forgotEmail">E-mail</label>
                            <input 
                                type="email" 
                                id="forgotEmail"
                                value={formData.email} 
                                onChange={handleChange}
                                name="email"
                                placeholder="seu-email@exemplo.com" 
                                required 
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Enviar Link de Redefinição'
                            )}
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default LoginPage;