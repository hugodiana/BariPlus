import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from "firebase/messaging";
import { messaging } from './firebase';

// Importação de todas as páginas
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';
import AffiliatePortalPage from './pages/AffiliatePortalPage';
import ProfilePage from './pages/ProfilePage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import GastosPage from './pages/GastosPage';

// Componente auxiliar para capturar o código de referência do URL
function HandleReferral() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('bariplus_referral_code', refCode);
    }
  }, [searchParams]);
  return null;
}

// Componente auxiliar para as rotas protegidas
const AppRoutes = ({ usuario }) => {
  return (
    <Layout usuario={usuario}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/progresso" element={<ProgressoPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/consultas" element={<ConsultasPage />} />
        <Route path="/medicacao" element={<MedicationPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/diario-alimentar" element={<FoodDiaryPage />} />
        <Route path="/portal-afiliado" element={<AffiliatePortalPage />} />
        <Route path="/gastos" element={<GastosPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

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

  useEffect(() => {
    if ('serviceWorker' in navigator && messaging) {
      onMessage(messaging, (payload) => {
        toast.info(<div><strong>{payload.notification.title}</strong><br/>{payload.notification.body}</div>);
      });
    }
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <HandleReferral />
        <Routes>
          {/* --- ROTAS PÚBLICAS (Acessíveis por qualquer pessoa, a qualquer momento) --- */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={usuario ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
          <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
          
          {/* --- ROTAS INTERMEDIÁRIAS (precisam de usuário logado) --- */}
          <Route path="/planos" element={usuario ? <PricingPage /> : <Navigate to="/login" />} />
          <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
          
          {/* --- ROTA CORINGA (Catch-all) QUE GERE O ACESSO AO APP --- */}
          <Route path="/*" element={
            !usuario ? <Navigate to="/landing" /> :
            !usuario.isEmailVerified ? <Navigate to="/verify-email" state={{ email: usuario.email }} /> :
            !usuario.pagamentoEfetuado ? <Navigate to="/planos" /> :
            !usuario.onboardingCompleto ? <Navigate to="/bem-vindo" /> :
            <AppRoutes usuario={usuario} />
          }/>
        </Routes>
      </Router>
    </>
  );
}

export default App;