import React, { useState } from 'react';
import './LoginPage.css';
// A linha 'import logo from ...' FOI REMOVIDA daqui.

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const apiUrl = process.env.REACT_APP_API_URL;
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

  return (
    <div className="login-page-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-header">
          {/* ✅ CORREÇÃO: Usando o caminho público direto para a logo */}
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
            <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️' : '👁️'}
            </span>
        </div>

        <button type="submit" className="submit-button">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
        
        {message && <p className="message">{message}</p>}

        <div className="form-footer">
            <button type="button" className="link-button">
                Esqueci a minha senha
            </button>
            <button type="button" className="link-button" onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
        </div>
      </form>
    </div>
  );
};
export default LoginPage;