// client/src/App.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';
import LoadingSpinner from './components/LoadingSpinner';

const queryClient = new QueryClient();

// Lazy loading das páginas
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProgressoPage = lazy(() => import('./pages/ProgressoPage'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage'));
const ConsultasPage = lazy(() => import('./pages/ConsultasPage'));
const FoodDiaryPage = lazy(() => import('./pages/FoodDiaryPage'));
const MedicationPage = lazy(() => import('./pages/MedicationPage'));
const ExamsPage = lazy(() => import('./pages/ExamsPage'));
const GastosPage = lazy(() => import('./pages/GastosPage'));
const ConteudosPage = lazy(() => import('./pages/ConteudosPage'));
const ArtigoPage = lazy(() => import('./pages/ArtigoPage'));
const ConquistasPage = lazy(() => import('./pages/ConquistasPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HydrationPage = lazy(() => import('./pages/HydrationPage'));
const ReportCenterPage = lazy(() => import('./pages/ReportCenterPage'));
const PublicReportPage = lazy(() => import('./pages/PublicReportPage'));
const ConvitePage = lazy(() => import('./pages/ConvitePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const GanheRendaExtraPage = lazy(() => import('./pages/GanheRendaExtraPage'));
const PaymentStatusPage = lazy(() => import('./pages/PaymentStatusPage'));
const MeuPlanoPage = lazy(() => import('./pages/MeuPlanoPage'));
const DocumentosPage = lazy(() => import('./pages/DocumentosPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} />
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/verify-email/:token" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/relatorio/:token" element={<PublicReportPage />} />
              <Route path="/planos" element={<PricingPage />} />
              <Route path="/pagamento/sucesso" element={<PaymentStatusPage />} />
              <Route path="/pagamento/cancelado" element={<PaymentCancelPage />} />
              <Route path="/termos" element={<TermsPage />} />
              <Route path="/privacidade" element={<PrivacyPage />} />
              <Route path="/ganhe-renda-extra" element={<GanheRendaExtraPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Rotas de Autenticação */}
              <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
              <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
              <Route path="/convite/:codigo" element={<ConvitePage />} />

              {/* Rotas Protegidas */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="progresso" element={<ProgressoPage />} />
                  <Route path="checklist" element={<ChecklistPage />} />
                  <Route path="diario-alimentar" element={<FoodDiaryPage />} />
                  <Route path="meu-plano" element={<MeuPlanoPage />} />
                  <Route path="consultas" element={<ConsultasPage />} />
                  <Route path="medicacao" element={<MedicationPage />} />
                  <Route path="hidratacao" element={<HydrationPage />} />
                  <Route path="exames" element={<ExamsPage />} />
                  <Route path="gastos" element={<GastosPage />} />
                  <Route path="conquistas" element={<ConquistasPage />} />
                  <Route path="artigos" element={<ConteudosPage />} />
                  <Route path="artigos/:id" element={<ArtigoPage />} />
                  <Route path="relatorios" element={<ReportCenterPage />} />
                  <Route path="perfil" element={<ProfilePage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="documentos" element={<DocumentosPage />} />
              </Route>
              
              <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;