import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from "firebase/messaging";
import { messaging } from './firebase';
import PropTypes from 'prop-types';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loading para melhor performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const PaymentSuccessPage = React.lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = React.lazy(() => import('./pages/PaymentCancelPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProgressoPage = React.lazy(() => import('./pages/ProgressoPage'));
const ChecklistPage = React.lazy(() => import('./pages/ChecklistPage'));
const ConsultasPage = React.lazy(() => import('./pages/ConsultasPage'));
const MedicationPage = React.lazy(() => import('./pages/MedicationPage'));
const AffiliatePortalPage = React.lazy(() => import('./pages/AffiliatePortalPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const FoodDiaryPage = React.lazy(() => import('./pages/FoodDiaryPage'));
const Layout = React.lazy(() => import('./components/Layout'));
import GastosPage from './pages/GastosPage';

// Componente de Suspense personalizado
const SuspenseFallback = () => (
  <div className="full-page-loader">
    <LoadingSpinner size="large" />
  </div>
);

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const apiUrl = process.env.REACT_APP_API_URL;

  // Verificação de autenticação
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('bariplus_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Para cookies de sessão segura
      });

      if (!response.ok) {
        throw new Error('Sessão inválida');
      }

      const dadosCompletos = await response.json();
      setUsuario(dadosCompletos);
    } catch (error) {
      console.error('Erro de autenticação:', error);
      localStorage.removeItem('bariplus_token');
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    checkAuth();
    
    // Configura um interval para verificar autenticação periodicamente
    const authInterval = setInterval(checkAuth, 15 * 60 * 1000); // 15 minutos
    
    return () => clearInterval(authInterval);
  }, [checkAuth]);

  // Configura notificações push
  useEffect(() => {
    if ('serviceWorker' in navigator && notificationPermission === 'granted') {
      const unsubscribe = onMessage(messaging, (payload) => {
        toast.info(
          <div>
            <strong>{payload.notification.title}</strong>
            <br />
            {payload.notification.body}
          </div>,
          {
            toastId: payload.messageId, // Evita duplicatas
            autoClose: 5000
          }
        );
      });

      return () => unsubscribe();
    }
  }, [notificationPermission]);

  // Componente para rotas protegidas
  const ProtectedRoutes = () => {
    const location = useLocation();
    
    if (!usuario) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (!usuario.pagamentoEfetuado) {
      return <Navigate to="/planos" state={{ from: location }} replace />;
    }
    
    if (!usuario.onboardingCompleto) {
      return <Navigate to="/bem-vindo" state={{ from: location }} replace />;
    }

    return (
      <Layout usuario={usuario}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/progresso" element={<ProgressoPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/medicacao" element={<MedicationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/diario-alimentar" element={<FoodDiaryPage />} />
          <Route path="/portal-afiliado" element={<AffiliatePortalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    );
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <React.Suspense fallback={<SuspenseFallback />}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
          <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
          <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
          
          {/* Rotas de autenticação */}
          <Route 
            path="/login" 
            element={usuario ? <Navigate to="/" replace /> : <LoginPage />} 
          />
          
          {/* Rotas intermediárias */}
          <Route 
            path="/planos" 
            element={usuario ? <PricingPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/bem-vindo" 
            element={usuario ? <OnboardingPage /> : <Navigate to="/login" replace />} 
          />
          
          {/* Rotas protegidas */}
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </React.Suspense>
  );
}

export default App;