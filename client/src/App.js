import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importação de todas as páginas
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';

// Componente auxiliar para organizar as rotas protegidas
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/progresso" element={<ProgressoPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/consultas" element={<ConsultasPage />} />
        <Route path="/medicacao" element={<MedicationPage />} />
        {/* Se o usuário logado tentar acessar uma rota desconhecida, volta para o painel */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    if (token) {
      fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida');
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

  return (
    <Router>
      <Routes>
        {/* Bloco de rotas para quando o usuário NÃO está logado */}
        {!usuario && (
          <>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
            {/* Se não estiver logado, qualquer outra rota leva para a Landing Page */}
            <Route path="*" element={<Navigate to="/landing" />} />
          </>
        )}

        {/* Bloco de rotas para quando o usuário ESTÁ logado */}
        {usuario && (
          <>
            <Route path="/planos" element={usuario.pagamentoEfetuado ? <Navigate to="/" /> : <PricingPage />} />
            <Route path="/bem-vindo" element={usuario.onboardingCompleto ? <Navigate to="/" /> : <OnboardingPage />} />
            <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
            <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
            
            {/* Rota principal que decide se mostra o app ou redireciona */}
            <Route path="/*" element={
                !usuario.pagamentoEfetuado ? <Navigate to="/planos" />
              : !usuario.onboardingCompleto ? <Navigate to="/bem-vindo" />
              : <AppRoutes /> // Se tudo estiver OK, carrega o app principal
            }/>
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;