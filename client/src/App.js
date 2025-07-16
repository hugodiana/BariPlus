import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    if (token) {
      fetch(`${apiUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida ou expirada');
        }
        return res.json();
      })
      .then(dadosCompletos => setUsuario(dadosCompletos))
      .catch(error => {
        console.error(error);
        setUsuario(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  // Componente interno para gerir rotas protegidas
  const ProtectedRoutes = () => {
    if (!usuario) {
      return <Navigate to="/login" replace />;
    }
    if (!usuario.pagamentoEfetuado) {
        return <Navigate to="/planos" replace />;
    }
    if (!usuario.onboardingCompleto) {
        return <Navigate to="/bem-vindo" replace />;
    }
    
    // Se passou por todas as verificações, renderiza o app principal
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/progresso" element={<ProgressoPage />} />
                <Route path="/checklist" element={<ChecklistPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/medicacao" element={<MedicationPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={usuario ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
        <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
        <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
        
        {/* Rotas que precisam de um usuário logado para serem decididas */}
        <Route path="/planos" element={usuario ? <PricingPage /> : <Navigate to="/login" />} />
        <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
        
        {/* Rota principal que delega a decisão para o ProtectedRoutes */}
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;