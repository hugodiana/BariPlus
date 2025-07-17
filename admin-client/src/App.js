import React, { useState, useEffect } from 'react';
import './App.css';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError('');
      fetch(`${apiUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 403) throw new Error('Acesso negado. Você não é um administrador.');
        if (!res.ok) throw new Error('Erro de rede ou no servidor.');
        return res.json();
      })
      .then(data => setUsers(data))
      .catch(err => {
        setError(err.message);
        localStorage.removeItem('bariplus_admin_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
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
  
  // ✅ NOVIDADE: Função para liberar o acesso de um usuário
  const handleGrantAccess = async (userId) => {
      if (!window.confirm("Tem certeza que quer liberar o acesso para este usuário sem pagamento?")) return;

      try {
        const response = await fetch(`${apiUrl}/api/admin/grant-access/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedUser = await response.json();
        if (!response.ok) throw new Error(updatedUser.message || 'Falha ao liberar acesso.');

        // Atualiza a lista de usuários na tela para refletir a mudança
        setUsers(prevUsers => prevUsers.map(user => 
            user._id === updatedUser._id ? updatedUser : user
        ));

      } catch(err) {
          alert(`Erro: ${err.message}`);
      }
  };

  // Se não houver token, mostra o formulário de login
  if (!token) {
    return (
      <div className="admin-login-container">
        <form onSubmit={handleLogin}>
          <h2>Painel de Administração - BariPlus</h2>
          <input type="text" placeholder="Email ou Username" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          <div className="password-wrapper">
            <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
            <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>👁️</span>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    );
  }

  // Se houver token, mostra a lista de usuários
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Painel de Usuários ({users.length})</h1>
        <button onClick={handleLogout}>Sair</button>
      </header>
      {loading && <p>Carregando usuários...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        <div className="table-wrapper">
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
                        {/* ✅ NOVIDADE: Estilo para o status */}
                        <td>
                          {user.pagamentoEfetuado 
                            ? <span className="status status-pago">Sim</span> 
                            : <span className="status status-pendente">Não</span>
                          }
                        </td>
                        <td>{user.onboardingCompleto ? '✅ Sim' : '❌ Não'}</td>
                        <td>
                          {/* ✅ NOVIDADE: Botão agora é funcional */}
                          <button onClick={() => handleGrantAccess(user._id)} disabled={user.pagamentoEfetuado}>
                            Liberar Acesso
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}

export default AdminApp;