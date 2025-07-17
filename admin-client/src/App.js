import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
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
      Promise.all([
        fetch(`${apiUrl}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      .then(async ([usersRes, statsRes]) => {
        if (usersRes.status === 403 || statsRes.status === 403) throw new Error('Acesso negado. Você não é um administrador.');
        if (!usersRes.ok || !statsRes.ok) throw new Error('Erro de rede ou no servidor.');
        
        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        
        setUsers(usersData);
        setStats(statsData);
      })
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
  
  const handleGrantAccess = async (userId) => {
      if (!window.confirm("Tem certeza que quer liberar o acesso para este usuário sem pagamento?")) return;
      try {
        const response = await fetch(`${apiUrl}/api/admin/grant-access/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedUser = await response.json();
        if (!response.ok) throw new Error(updatedUser.message || 'Falha ao liberar acesso.');
        setUsers(prevUsers => prevUsers.map(user => 
            user._id === updatedUser._id ? updatedUser : user
        ));
        toast.success('Acesso liberado com sucesso!');
      } catch(err) {
          toast.error(err.message || "Ocorreu um erro.");
      }
  };

  if (!token) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={4000} />
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
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="admin-container">
        <header className="admin-header">
          <h1>Painel de Administração</h1>
          <button onClick={handleLogout}>Sair</button>
        </header>

        {(loading && !stats) && <p>Carregando...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && stats && (
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>{stats.totalUsers}</h2>
                    <p>Usuários Totais</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.paidUsers}</h2>
                    <p>Contas Pagas</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.newUsersLast7Days}</h2>
                    <p>Novos nos últimos 7 dias</p>
                </div>
            </div>
        )}
        
        <div className="user-table-container">
            <h2>Usuários Cadastrados ({users.length})</h2>
            {!loading && (
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
                              <td>
                                {user.pagamentoEfetuado 
                                  ? <span className="status status-pago">Sim</span> 
                                  : <span className="status status-pendente">Não</span>
                                }
                              </td>
                              <td>{user.onboardingCompleto ? '✅ Sim' : '❌ Não'}</td>
                              <td>
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
      </div>
    </>
  );
}

export default AdminApp;