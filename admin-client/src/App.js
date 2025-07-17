import React, { useState, useEffect } from 'react';
// NOVIDADE: Imports da biblioteca de notificações
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    useEffect(() => {
    if (token) {
      setLoading(true);
      setError('');
      // ✅ CORREÇÃO: Usando Promise.all para buscar usuários e stats ao mesmo tempo
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
  
  cconst handleGrantAccess = async (userId) => {
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
      <div className="admin-container">
        <header className="admin-header">
          <h1>Painel de Administração</h1>
          <button onClick={handleLogout}>Sair</button>
        </header>

        {/* ✅ CORREÇÃO: Exibindo os cards de estatísticas */}
        {loading && <p>Carregando...</p>}
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
            {!loading && !error && (
              <div className="table-wrapper">
                  <table>
                      {/* ... (sua tabela de usuários continua igual) ... */}
                  </table>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
export default AdminApp;