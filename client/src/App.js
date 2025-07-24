import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

// Importação de páginas
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
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
import AffiliatePortalPage from './pages/AffiliatePortalPage';
import ProfilePage from './pages/ProfilePage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import GastosPage from './pages/GastosPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyPage from './pages/VerifyPage';

// Componente para manipulação de código de referência
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

// Componente para rotas protegidas
const ProtectedRoutes = ({ user }) => {
  return (
    <Layout user={user}>
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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchUserData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && messaging) {
      onMessage(messaging, (payload) => {
        toast.info(
          <div>
            <strong>{payload.notification.title}</strong>
            <br />
            {payload.notification.body}
          </div>
        );
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        Carregando...
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Router>
        <HandleReferral />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyPage />} />
          <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
          <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />

          {/* Rotas intermediárias */}
          <Route path="/planos" element={user ? <PricingPage /> : <Navigate to="/login" />} />
          <Route path="/bem-vindo" element={user ? <OnboardingPage /> : <Navigate to="/login" />} />
          <Route path="/verify-email" element={user ? <VerifyEmailPage /> : <Navigate to="/login" />} />

          {/* Rota principal */}
          <Route
            path="/*"
            element={
              !user ? (
                <Navigate to="/landing" />
              ) : !user.isEmailVerified ? (
                <Navigate to="/verify-email" state={{ email: user.email }} />
              ) : !user.pagamentoEfetuado ? (
                <Navigate to="/planos" />
              ) : !user.onboardingCompleto ? (
                <Navigate to="/bem-vindo" />
              ) : (
                <ProtectedRoutes user={user} />
              )
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;