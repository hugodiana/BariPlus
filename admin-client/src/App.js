import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageAffiliatesPage from './pages/ManageAffiliatesPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('bariplus_admin_token'));
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchUserData = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      return;
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      handleLogout();
      toast.error('Sessão expirada. Por favor, faça login novamente.');
    }
  }, [apiUrl]);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('bariplus_admin_token');
      await fetchUserData(storedToken);
      setLoading(false);
    };
    
    verifyToken();
  }, [fetchUserData]);
  
  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('bariplus_admin_token', newToken);
    setToken(newToken);
    fetchUserData(newToken);
    toast.success('Login realizado com sucesso!');
  };
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('bariplus_admin_token');
    setToken(null);
    setUser(null);
    toast.info('Você foi desconectado.');
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="app-container">
      <ToastContainer 
        position="top-right" 
        autoClose={4000} 
        pauseOnHover
        theme="colored"
      />
      
      <Router>
        <Routes>
          {/* Rotas públicas */}
          {!token && (
            <>
              <Route path="/login" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
          
          {/* Rotas protegidas */}
          {token && (
            <Route element={<AdminLayout user={user} handleLogout={handleLogout} />}>
              <Route path="/dashboard" element={<AdminDashboardPage />} />
              <Route path="/users" element={<ManageUsersPage />} />
              <Route path="/affiliates" element={<ManageAffiliatesPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          )}
        </Routes>
      </Router>
    </div>
  );
}

export default App;