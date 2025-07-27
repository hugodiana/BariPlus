import React, { useState, useEffect } from 'react';
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

  // Simples verificação do token
  useEffect(() => {
    setToken(localStorage.getItem('bariplus_admin_token'));
    setLoading(false);
  }, []);
  
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('bariplus_admin_token', newToken);
    setToken(newToken);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('bariplus_admin_token');
    setToken(null);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Routes>
          {/* Se não houver token, a única rota é a de login */}
          {!token && <Route path="*" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />}
          
          {/* Se houver token, carrega as rotas protegidas dentro do Layout */}
          {token && (
            <Route path="/*" element={
              <AdminLayout handleLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/users" element={<ManageUsersPage />} />
                  <Route path="/affiliates" element={<ManageAffiliatesPage />} />
                  {/* Redireciona qualquer outra rota para o dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </AdminLayout>
            }/>
          )}
        </Routes>
      </Router>
    </>
  );
}
export default App;