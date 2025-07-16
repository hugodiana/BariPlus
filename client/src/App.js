import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Nossas páginas
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';

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

  // Se o usuário NÃO está logado, ele só pode acessar estas rotas
  if (!usuario) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
          <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
          {/* Qualquer outra rota redireciona para o login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  // Se o usuário ESTÁ logado, entramos nesta lógica
  return (
    <Router>
      <Routes>
        {/* Se ele não pagou, todas as rotas levam para a página de planos */}
        {!usuario.pagamentoEfetuado && <Route path="*" element={<Navigate to="/planos" />} />}
        <Route path="/planos" element={<PricingPage />} />
        
        {/* Se ele pagou mas não completou o onboarding, vai para o onboarding */}
        {usuario.pagamentoEfetuado && !usuario.onboardingCompleto && <Route path="*" element={<Navigate to="/bem-vindo" />} />}
        <Route path="/bem-vindo" element={<OnboardingPage />} />

        {/* Se ele pagou E completou o onboarding, tem acesso ao app completo */}
        {usuario.pagamentoEfetuado && usuario.onboardingCompleto && (
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/progresso" element={<ProgressoPage />} />
                <Route path="/checklist" element={<ChecklistPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/medicacao" element={<MedicationPage />} />
                {/* Se acessar uma rota desconhecida dentro do app, volta ao painel */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          }/>
        )}
      </Routes>
    </Router>
  );
}

export default App;