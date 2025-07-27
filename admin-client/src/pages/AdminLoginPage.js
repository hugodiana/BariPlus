import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../App.css'; // Reutilizando o estilo principal

const AdminLoginPage = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas');
      }
      toast.success('Login realizado com sucesso!');
      // Chama a função do App.js para guardar o token e atualizar o estado
      onLoginSuccess(data.token);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-app">
      <div className="admin-login-container">
        <div className="login-box">
          <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo-admin" />
          <h2>Painel de Administração</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email ou Username</label>
              <input 
                type="text" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="submit-btn-admin" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;