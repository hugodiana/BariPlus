import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes e Páginas
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; // Importa o nosso novo segurança
import LoadingSpinner from './components/LoadingSpinner';

// Páginas Públicas
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Páginas Intermediárias
import PricingPage from './pages/PricingPage';
import OnboardingPage from './pages/OnboardingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

// Páginas Protegidas
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';
import AffiliatePortalPage from './pages/AffiliatePortalPage';
import ProfilePage from './pages/ProfilePage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import GastosPage from './pages/GastosPage';


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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Layout usuario={usuario}>
          <Routes>
            {/* --- ROTAS PÚBLICAS (acessíveis por todos) --- */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            
            {/* --- ROTAS INTERMEDIÁRIAS (precisam de login, mas não de tudo) --- */}
            <Route path="/planos" element={usuario ? <PricingPage /> : <Navigate to="/login" />} />
            <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
            <Route path="/pagamento-sucesso" element={usuario ? <PaymentSuccessPage /> : <Navigate to="/login" />} />
            <Route path="/pagamento-cancelado" element={usuario ? <PaymentCancelPage /> : <Navigate to="/login" />} />

            {/* --- ROTAS PROTEGIDAS (o "segurança" decide se pode entrar) --- */}
            <Route path="/" element={<ProtectedRoute usuario={usuario}><DashboardPage /></ProtectedRoute>} />
            <Route path="/progresso" element={<ProtectedRoute usuario={usuario}><ProgressoPage /></ProtectedRoute>} />
            <Route path="/checklist" element={<ProtectedRoute usuario={usuario}><ChecklistPage /></ProtectedRoute>} />
            <Route path="/consultas" element={<ProtectedRoute usuario={usuario}><ConsultasPage /></ProtectedRoute>} />
            <Route path="/medicacao" element={<ProtectedRoute usuario={usuario}><MedicationPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute usuario={usuario}><ProfilePage /></ProtectedRoute>} />
            <Route path="/diario-alimentar" element={<ProtectedRoute usuario={usuario}><FoodDiaryPage /></ProtectedRoute>} />
            <Route path="/portal-afiliado" element={<ProtectedRoute usuario={usuario}><AffiliatePortalPage /></ProtectedRoute>} />
            <Route path="/gastos" element={<ProtectedRoute usuario={usuario}><GastosPage /></ProtectedRoute>} />

            {/* Rota "catch-all" para redirecionar qualquer outra coisa */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;