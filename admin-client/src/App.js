import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Modal from './components/Modal';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(30); // Padrão de 30%
  const [viewFilter, setViewFilter] = useState('all');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      // ✅ CORREÇÃO: Adicionada a busca por candidaturas pendentes
      const [usersRes, statsRes, pendingRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/pending-affiliates`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (!usersRes.ok || !statsRes.ok || !pendingRes.ok) {
        throw new Error('Erro ao carregar dados do painel.');
      }
      const [usersData, statsData, pendingData] = await Promise.all([usersRes.json(), statsRes.json(), pendingRes.json()]);
      
      setUsers(usersData.users || usersData);
      setStats(statsData);
      setPendingAffiliates(pendingData);

    } catch (err) {
      setError(err.message);
      if (err.message.includes('Acesso negado') || err.message.includes('Sessão inválida')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Credenciais inválidas');
      localStorage.setItem('bariplus_admin_token', data.token);
      setToken(data.token);
      toast.success('Login realizado com sucesso!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bariplus_admin_token');
    setToken(null);
    setUsers([]);
    setStats(null);
  };
  
  const handleGrantAccess = async (userId) => {
    if (!window.confirm("Tem certeza que quer liberar o acesso para este usuário?")) return;
    try {
      const response = await fetch(`${apiUrl}/api/admin/grant-access/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao liberar acesso');
      }
      const updatedUser = await response.json();
      setUsers(prevUsers => prevUsers.map(user => user._id === updatedUser._id ? updatedUser : user));
      toast.success('Acesso liberado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openPromoteModal = (user) => {
    setUserToPromote(user);
    // No caso de aprovação, o 'user' é o 'profile', então acedemos a 'userId'
    setCouponCode(user.userId.username.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    setIsPromoteModalOpen(true);
  };

  const handlePromoteToAffiliate = async (e) => {
    e.preventDefault();
    if (!couponCode || !commissionPercent) return toast.error('Preencha todos os campos');
    try {
      const response = await fetch(`${apiUrl}/api/admin/approve-affiliate/${userToPromote.userId._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ couponCode })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao promover usuário');
      }
      toast.success(`Afiliado aprovado com sucesso!`);
      setIsPromoteModalOpen(false);
      fetchAdminData(); // Recarrega todos os dados
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!token) {
    return (
        <div className="admin-app">
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="admin-login-container">
                <div className="login-box">
                    <h2>Painel de Administração</h2>
                    <form onSubmit={handleLogin}>
                      <div className="input-group">
                        <label>Email ou Username</label>
                        <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>Senha</label>
                        <div className="password-input">
                          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                          <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                      {error && <p className="error-message">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
  }

  const usersToDisplay = viewFilter === 'pending' ? [] : users; // Simplificado por agora
  const pendingToDisplay = viewFilter === 'pending' ? pendingAffiliates : [];

  return (
    <div className="admin-app">
      <ToastContainer position="top-right" autoClose={5000} />
      <header className="admin-header">
        <h1>Painel de Administração</h1>
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </header>
      <main className="admin-content">
        {loading && <div className="loading-overlay">Carregando...</div>}
        {stats && ( <div className="stats-grid">{/* ... */}</div> )}
        <div className="users-section">
            <div className="table-header">
                <h2>Gerir Usuários</h2>
                <div className="view-filters">
                    <button className={viewFilter === 'all' ? 'active' : ''} onClick={() => setViewFilter('all')}>Todos ({users.length})</button>
                    <button className={viewFilter === 'pending' ? 'active' : ''} onClick={() => setViewFilter('pending')}>Candidaturas ({pendingAffiliates.length})</button>
                </div>
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        {viewFilter === 'all' && ( <tr><th>Nome</th><th>Email</th><th>Tipo</th><th>Status</th><th>Ações</th></tr> )}
                        {viewFilter === 'pending' && ( <tr><th>Nome</th><th>Contato</th><th>Chave Pix</th><th>Ações</th></tr> )}
                    </thead>
                    <tbody>
                        {viewFilter === 'all' && users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.nome} {user.sobrenome}</td>
                                <td>{user.email}</td>
                                <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                                <td>{user.pagamentoEfetuado ? 'Ativo' : 'Pendente'}</td>
                                <td className="actions">{!user.pagamentoEfetuado && (<button onClick={() => handleGrantAccess(user._id)} className="btn-primary">Liberar</button>)}</td>
                            </tr>
                        ))}
                        {viewFilter === 'pending' && pendingAffiliates.map((profile) => (
                            <tr key={profile._id}>
                                <td>{profile.userId.nome} {profile.userId.sobrenome}</td>
                                <td>{profile.whatsapp}</td>
                                <td>{profile.pixKeyType}: {profile.pixKey}</td>
                                <td className="actions"><button onClick={() => openPromoteModal(profile)} className="btn-approve">Aprovar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
      <Modal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Promover a Afiliado">
        {userToPromote && (
            <form onSubmit={handlePromoteToAffiliate} className="modal-form">
                <p>Promovendo: <strong>{userToPromote.userId.nome}</strong></p>
                <div className="form-group"><label>Código do Cupom</label><input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} required /></div>
                <div className="form-actions"><button type="button" onClick={() => setIsPromoteModalOpen(false)} className="btn-cancel">Cancelar</button><button type="submit" className="btn-confirm">Confirmar</button></div>
            </form>
        )}
      </Modal>
    </div>
  );
}

export default AdminApp;