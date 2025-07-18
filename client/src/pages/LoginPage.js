import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Importando o Link
import './LoginPage.css';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const isRegisterMode = isRegistering;
    const url = isRegisterMode ? `${apiUrl}/api/register` : `${apiUrl}/api/login`;
    const body = isRegisterMode 
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
        if (isRegisterMode) {
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
    const apiUrl = process.env.REACT_APP_API_URL;
    try {
      const response = await fetch(`${apiUrl}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      toast.info(data.message); // Usando toast em vez de alert
      setIsForgotModalOpen(false);
      setForgotEmail('');
    } catch (error) {
      toast.error("Erro ao conectar com o servidor. Tente novamente.");
    }
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
            <input type="text" placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </>
        )}
        {!isRegistering ? (
             <input type="text" placeholder="E-mail ou Username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        ) : (
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
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

      {/* ✅ CORREÇÃO: Garantindo que o conteúdo do Modal está presente */}
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