import React, { useState, useEffect } from 'react';
import './App.css';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para o formulário de login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const apiUrl = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:3001';

  // Efeito para buscar os usuários se já tivermos um token
  useEffect(() => {
    if (token) {
      setLoading(true);
      setError('');
      fetch(`${apiUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 403) {
          throw new Error('Acesso negado. Você não é um administrador.');
        }
        if (!res.ok) {
          throw new Error('Erro de rede ou no servidor.');
        }
        return res.json();
      })
      .then(data => {
        setUsers(data);
      })
      .catch(err => {
        setError(err.message);
        // Limpa o token se ele for inválido
        localStorage.removeItem('bariplus_admin_token');
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [token, apiUrl]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha no login');
      
      localStorage.setItem('bariplus_admin_token', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bariplus_admin_token');
    setToken(null);
    setUsers([]);
  };

  // Se não houver token, mostra o formulário de login
  if (!token) {
    return (
      <div className="admin-login-container">
        <form onSubmit={handleLogin}>
          <h2>Painel de Administração - BariPlus</h2>
          <input 
            type="text" 
            placeholder="Email ou Username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
          />
          <input 
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    );
  }

  // Se houver token, mostra a lista de usuários
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Painel de Usuários</h1>
        <button onClick={handleLogout}>Sair</button>
      </header>
      {loading && <p>Carregando usuários...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Status Pagamento</th>
              <th>Onboarding Completo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.nome} {user.sobrenome}</td>
                <td>{user.email}</td>
                <td>{user.pagamentoEfetuado ? '✅ Sim' : '❌ Não'}</td>
                <td>{user.onboardingCompleto ? '✅ Sim' : '❌ Não'}</td>
                <td>
                  <button disabled={user.pagamentoEfetuado}>Liberar Acesso</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminApp;