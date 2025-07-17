import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Modal from './components/Modal'; // Garanta que o Modal foi copiado para a pasta 'admin-client/src/components'

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para o modal de promover afiliado
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(20);

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
    } else {
        setLoading(false);
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
        setUsers(prevUsers => prevUsers.map(user => user._id === updatedUser._id ? updatedUser : user));
        toast.success('Acesso liberado com sucesso!');
      } catch(err) {
          toast.error(err.message || "Ocorreu um erro.");
      }
  };

  const openPromoteModal = (user) => {
    setUserToPromote(user);
    setCouponCode(user.username.toUpperCase()); 
    setIsPromoteModalOpen(true);
  };

  const handlePromoteToAffiliate = async (e) => {
    e.preventDefault();
    if (!userToPromote || !couponCode || !commissionPercent) return;
    try {
        const response = await fetch(`${apiUrl}/api/admin/promote-to-affiliate/${userToPromote._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ couponCode, commissionPercent })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Falha ao promover usuário.');
        setUsers(prevUsers => prevUsers.map(user => user._id === data.usuario._id ? data.usuario : user));
        toast.success(`Usuário ${data.usuario.username} agora é um afiliado!`);
        setIsPromoteModalOpen(false);
    } catch (err) {
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
        {loading && <p>Carregando...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && stats && (
            <div className="stats-grid">
                <div className="stat-card"><h2>{stats.totalUsers}</h2><p>Usuários Totais</p></div>
                <div className="stat-card"><h2>{stats.paidUsers}</h2><p>Contas Pagas</p></div>
                <div className="stat-card"><h2>{stats.newUsersLast7Days}</h2><p>Novos nos últimos 7 dias</p></div>
            </div>
        )}
        <div className="user-table-container">
            <h2>Usuários Cadastrados ({users.length})</h2>
            {!loading && !error && (
              <div className="table-wrapper">
                  <table>
                      <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Função (Role)</th>
                            <th>Pagamento</th>
                            <th>Onboarding</th>
                            <th>Ações</th>
                          </tr>
                      </thead>
                      <tbody>
                          {users.map(user => (
                            <tr key={user._id}>
                              <td>{user.nome} {user.sobrenome}</td>
                              <td>{user.email}</td>
                              <td><span className={`status status-${user.role}`}>{user.role}</span></td>
                              <td>{user.pagamentoEfetuado ? <span className="status status-pago">Sim</span> : <span className="status status-pendente">Não</span>}</td>
                              <td>{user.onboardingCompleto ? '✅ Sim' : '❌ Não'}</td>
                              <td className="actions-cell">
                                <button onClick={() => handleGrantAccess(user._id)} disabled={user.pagamentoEfetuado}>Liberar Pagamento</button>
                                {user.role === 'user' && user.pagamentoEfetuado && (
                                  <button className="promote-btn" onClick={() => openPromoteModal(user)}>Tornar Afiliado</button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            )}
        </div>
      </div>
      <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)}>
        <h2>Promover a Afiliado</h2>
        {userToPromote && (
            <form onSubmit={handlePromoteToAffiliate} className="modal-form">
                <p>Você está promovendo <strong>{userToPromote.nome} {userToPromote.sobrenome}</strong>.</p>
                <label>Código do Cupom de Desconto</label>
                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} required />
                <label>Percentagem de Desconto (%)</label>
                <input type="number" min="1" max="100" value={commissionPercent} onChange={e => setCommissionPercent(e.target.value)} required />
                <button type="submit">Confirmar e Criar Cupom</button>
            </form>
        )}
      </Modal>
    </>
  );
}

export default AdminApp;