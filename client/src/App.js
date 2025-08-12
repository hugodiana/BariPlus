// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes e Páginas
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import PricingPage from './pages/PricingPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyPage from './pages/VerifyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import MedicationPage from './pages/MedicationPage';
import GastosPage from './pages/GastosPage';
import ConquistasPage from './pages/ConquistasPage';
import ExamsPage from './pages/ExamsPage';
import ArtigoPage from './pages/ArtigoPage';
import ConteudosPage from './pages/ConteudosPage';
import GanheRendaExtraPage from './pages/GanheRendaExtraPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true); // Começa a carregar
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('bariplus_token');
      if (token) {
        try {
          const res = await fetch(`${apiUrl}/api/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            localStorage.removeItem('bariplus_token');
            throw new Error('Sessão inválida');
          }
          const data = await res.json();
          setUsuario(data);
        } catch (error) {
          console.error(error);
          setUsuario(null);
        }
      }
      setLoading(false); // Para de carregar após a verificação
    };

    fetchUser();
  }, [apiUrl]);

  // Enquanto estiver a verificar o token, mostra um ecrã de carregamento
  if (loading) {
    return <LoadingSpinner />;
  }

  // Após a verificação, renderiza as rotas corretas
  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Routes>
          {/* --- Rotas Públicas (acessíveis sem login) --- */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyPage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />

          {/* --- Rota Principal da Aplicação --- */}
          {/* O "/*" captura todas as outras rotas */}
          <Route
            path="/*"
            element={
              // O ProtectedRoute agora é o único responsável por decidir o que fazer
              <ProtectedRoute usuario={usuario}>
                {/* Se o utilizador passar em todas as verificações do ProtectedRoute... */}
                {/* ...ele entra aqui, no Layout principal da aplicação */}
                <Layout usuario={usuario}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/progresso" element={<ProgressoPage />} />
                    <Route path="/checklist" element={<ChecklistPage />} />
                    <Route path="/consultas" element={<ConsultasPage />} />
                    <Route path="/diario-alimentar" element={<FoodDiaryPage />} />
                    <Route path="/medicacao" element={<MedicationPage />} />
                    <Route path="/gastos" element={<GastosPage />} />
                    <Route path="/conquistas" element={<ConquistasPage />} />
                    <Route path="/exames" element={<ExamsPage />} />
                    <Route path="/artigos" element={<ConteudosPage />} />
                    <Route path="/artigos/:id" element={<ArtigoPage />} />
                    <Route path="/ganhe-renda-extra" element={<GanheRendaExtraPage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                    {/* Rotas intermédias que o ProtectedRoute irá gerir */}
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/planos" element={<PricingPage />} />
                    <Route path="/pagamento-status" element={<PaymentStatusPage />} />
                    <Route path="/bem-vindo" element={<OnboardingPage />} />
                     {/* Qualquer outra rota desconhecida dentro do app leva ao painel */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;