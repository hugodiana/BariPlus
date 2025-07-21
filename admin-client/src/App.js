import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Modal from './components/Modal';

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [commissionPercent, setCommissionPercent] = useState(20);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Função para buscar dados do admin
  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/users`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }),
        fetch(`${apiUrl}/api/admin/stats`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        const errorData = await usersRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao carregar dados');
      }

      const [usersData, statsData] = await Promise.all([
        usersRes.json(),
        statsRes.json()
      ]);

      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Acesso negado')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token, apiUrl]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');
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
    toast.info('Você saiu do painel de administração');
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
      setUsers(prevUsers => 
        prevUsers.map(user => user._id === updatedUser._id ? updatedUser : user)
      );
      toast.success('Acesso liberado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openPromoteModal = (user) => {
    setUserToPromote(user);
    setCouponCode(user.username.toUpperCase().replace(/\s+/g, '_')); 
    setIsPromoteModalOpen(true);
  };

  const handlePromoteToAffiliate = async (e) => {
    e.preventDefault();
    if (!couponCode || !commissionPercent) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/admin/promote-to-affiliate/${userToPromote._id}`, 
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ couponCode, commissionPercent })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao promover usuário');
      }

      const data = await response.json();
      setUsers(prevUsers => 
        prevUsers.map(user => user._id === data.usuario._id ? data.usuario : user)
      );
      toast.success(`${data.usuario.nome} agora é um afiliado!`);
      setIsPromoteModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!token) {
    return (
      <div className="admin-app">
        <ToastContainer 
          position="top-right" 
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="admin-login-container">
          <div className="login-box">
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
              <button type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <header className="admin-header">
        <h1>Painel de Administração</h1>
        <button onClick={handleLogout} className="logout-btn">
          Sair
        </button>
      </header>

      <main className="admin-content">
        {loading && <div className="loading-overlay">Carregando...</div>}
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total de Usuários</h3>
              <p>{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Contas Ativas</h3>
              <p>{stats.paidUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Novos (7 dias)</h3>
              <p>{stats.newUsersLast7Days}</p>
            </div>
          </div>
        )}

        <div className="users-section">
          <h2>Usuários Cadastrados</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Onboarding</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.nome} {user.sobrenome}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.pagamentoEfetuado ? (
                        <span className="badge success">Ativo</span>
                      ) : (
                        <span className="badge warning">Pendente</span>
                      )}
                    </td>
                    <td>
                      {user.onboardingCompleto ? (
                        <span className="badge success">Completo</span>
                      ) : (
                        <span className="badge danger">Incompleto</span>
                      )}
                    </td>
                    <td className="actions">
                      {!user.pagamentoEfetuado && (
                        <button
                          onClick={() => handleGrantAccess(user._id)}
                          className="btn-primary"
                        >
                          Liberar Acesso
                        </button>
                      )}
                      {user.role === 'user' && user.pagamentoEfetuado && (
                        <button
                          onClick={() => openPromoteModal(user)}
                          className="btn-secondary"
                        >
                          Tornar Afiliado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Promover a Afiliado"
      >
        {userToPromote && (
          <form onSubmit={handlePromoteToAffiliate} className="modal-form">
            <p>
              Promovendo: <strong>{userToPromote.nome} {userToPromote.sobrenome}</strong>
            </p>
            
            <div className="form-group">
              <label>Código do Cupom</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Comissão (%)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                required
              />
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-confirm">
                Confirmar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default AdminApp;