import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Importa o novo Layout e as novas Páginas
import AdminLayout from './components/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageAffiliatesPage from './pages/ManageAffiliatesPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null); // Adicionado para passar ao Layout

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Busca os dados do usuário admin logado
  const fetchMe = useCallback(async (currentToken) => {
    if (!currentToken) {
        setUsuario(null);
        return;
    }
    try {
        const res = await fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.ok) {
            const data = await res.json();
            setUsuario(data);
        } else {
            setUsuario(null);
        }
    } catch (error) {
        setUsuario(null);
    }
  }, [apiUrl]);

  useEffect(() => {
    const currentToken = localStorage.getItem('bariplus_admin_token');
    setToken(currentToken);
    fetchMe(currentToken).finally(() => setLoading(false));
  }, [fetchMe]);
  
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('bariplus_admin_token', newToken);
    setToken(newToken);
    fetchMe(newToken); // Busca os dados do usuário após o login
  };
  
  const handleLogout = () => {
    localStorage.removeItem('bariplus_admin_token');
    setToken(null);
    setUsuario(null);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Routes>
          {!token ? (
            // Se não houver token, só a rota de login é acessível
            <Route path="/login" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />
          ) : (
            // Se houver token, carrega as rotas protegidas
            <Route path="/*" element={
              <AdminLayout handleLogout={handleLogout} usuario={usuario}>
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/users" element={<ManageUsersPage />} />
                  <Route path="/affiliates" element={<ManageAffiliatesPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </AdminLayout>
            }/>
          )}
           {/* Se não houver token, qualquer outra rota redireciona para o login */}
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </>
  );
}
export default App;