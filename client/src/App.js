// client/src/App.js
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { fetchApi, setAuthToken } from './utils/api';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load de todas as páginas
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
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
const DocumentosPage = lazy(() => import('./pages/DocumentosPage')); // ✅ ROTA QUE FALTAVA

function App() {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
    });

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('bariplus_token');
            if (token) {
                setAuthToken(token);
                try {
                    const userData = await fetchApi('/api/me');
                    setAuth({ isAuthenticated: true, user: userData, isLoading: false });
                } catch (error) {
                    setAuth({ isAuthenticated: false, user: null, isLoading: false });
                    setAuthToken(null);
                }
            } else {
                setAuth({ isAuthenticated: false, user: null, isLoading: false });
            }
        };
        verifyUser();
    }, []);

    const handleLoginSuccess = (userData) => {
        setAuth({ isAuthenticated: true, user: userData, isLoading: false });
    };

    const handleLogout = () => {
        setAuthToken(null);
        setAuth({ isAuthenticated: false, user: null, isLoading: false });
    };

    if (auth.isLoading) {
        return <LoadingSpinner fullPage />;
    }

    return (
        <Router>
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} />
                <Routes>
                    {/* Rotas Públicas */}
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/login" element={!auth.isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
                    <Route path="/register" element={!auth.isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
                    <Route path="/verify-email/:token" element={<VerifyPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/relatorio/:token" element={<PublicReportPage />} />
                    <Route path="/convite/:codigo" element={<ConvitePage />} />
                    <Route path="/planos" element={<PricingPage />} />
                    <Route path="/pagamento/sucesso" element={<PaymentStatusPage />} />
                    <Route path="/pagamento/cancelado" element={<PaymentCancelPage />} />
                    <Route path="/termos" element={<TermsPage />} />
                    <Route path="/privacidade" element={<PrivacyPage />} />
                    <Route path="/ganhe-renda-extra" element={<GanheRendaExtraPage />} />

                    <Route path="/onboarding" element={
                        auth.isAuthenticated && !auth.user?.onboardingCompleto
                            ? <OnboardingPage />
                            : <Navigate to={auth.isAuthenticated ? "/" : "/login"} />
                    }/>
                    
                    {/* ✅ CORREÇÃO: A prop foi renomeada para 'usuario' para ser consistente com o seu Layout.js */}
                    <Route path="/" element={<ProtectedRoute auth={auth}><Layout usuario={auth.user} onLogout={handleLogout} /></ProtectedRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="meu-plano" element={<MeuPlanoPage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="documentos" element={<DocumentosPage />} /> {/* ✅ ROTA QUE FALTAVA */}
                        <Route path="progresso" element={<ProgressoPage />} />
                        <Route path="diario" element={<FoodDiaryPage />} />
                        <Route path="hidratacao" element={<HydrationPage />} />
                        <Route path="checklist" element={<ChecklistPage />} />
                        <Route path="medicacao" element={<MedicationPage />} />
                        <Route path="consultas" element={<ConsultasPage />} />
                        <Route path="exames" element={<ExamsPage />} />
                        <Route path="gastos" element={<GastosPage />} />
                        <Route path="conquistas" element={<ConquistasPage />} />
                        <Route path="artigos" element={<ConteudosPage />} />
                        <Route path="artigos/:id" element={<ArtigoPage />} />
                        <Route path="relatorios" element={<ReportCenterPage />} />
                        <Route path="perfil" element={<ProfilePage />} />
                    </Route>
                    
                    <Route path="*" element={<Navigate to={auth.isAuthenticated ? "/" : "/landing"} />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;