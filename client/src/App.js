import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from "firebase/messaging";
import { messaging } from './firebase';

// Componentes
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Páginas Públicas e Intermediárias
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PricingPage from './pages/PricingPage';
import OnboardingPage from './pages/OnboardingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentStatusPage from './pages/PaymentStatusPage';

// Páginas Protegidas (do App Principal)
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';
import AffiliatePortalPage from './pages/AffiliatePortalPage';
import ProfilePage from './pages/ProfilePage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import GastosPage from './pages/GastosPage';


// Componente "Porteiro" que protege as rotas privadas
const PrivateRoutes = ({ usuario }) => {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (!usuario.isEmailVerified) {
    return <Navigate to="/verify-email" state={{ email: usuario.email }} replace />;
  }
  if (!usuario.pagamentoEfetuado) {
    return <Navigate to="/planos" replace />;
  }
  if (!usuario.onboardingCompleto) {
    return <Navigate to="/bem-vindo" replace />;
  }
  
  // Se passou por todas as verificações, renderiza o Layout, 
  // que por sua vez renderiza a página filha através do <Outlet />
  return (
    <Layout usuario={usuario}>
      <Outlet /> 
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
            return null;
          }
          return res.json();
        })
        .then(dadosCompletos => setUsuario(dadosCompletos))
        .catch(() => setUsuario(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // useEffect para notificações com o app aberto
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      onMessage(messaging, (payload) => {
        toast.info(<div><strong>{payload.notification.title}</strong><br/>{payload.notification.body}</div>);
      });
    }
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Routes>
          {/* --- ROTAS PÚBLICAS E INTERMEDIÁRIAS (acessíveis dependendo do estado de login) --- */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/planos" element={usuario ? <PricingPage /> : <Navigate to="/login" />} />
          <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
          <Route path="/pagamento-sucesso" element={usuario ? <PaymentSuccessPage /> : <Navigate to="/login" />} />
          <Route path="/pagamento-cancelado" element={usuario ? <PaymentCancelPage /> : <Navigate to="/login" />} />
          <Route path="/pagamento-status" element={<PaymentStatusPage />} />

          {/* --- ÁREA PRIVADA (o "Porteiro" decide se pode entrar) --- */}
          <Route element={<PrivateRoutes usuario={usuario} />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/progresso" element={<ProgressoPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/consultas" element={<ConsultasPage />} />
            <Route path="/medicacao" element={<MedicationPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/diario-alimentar" element={<FoodDiaryPage />} />
            <Route path="/portal-afiliado" element={<AffiliatePortalPage />} />
            <Route path="/gastos" element={<GastosPage />} />
          </Route>
          
          {/* Rota final para qualquer endereço não encontrado */}
          <Route path="*" element={<Navigate to={usuario ? "/" : "/landing"} />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;