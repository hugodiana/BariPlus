// src/App.js

// 1. Importar 'lazy' e 'Suspense' do React
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { setAuthToken, fetchApi } from './utils/api';

// Layouts e Componentes de Rota
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// 2. Importar as páginas públicas de forma normal (elas carregam imediatamente)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VerifyPage from './pages/VerifyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import PricingPage from './pages/PricingPage';
import OnboardingPage from './pages/OnboardingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PublicReportPage from './pages/PublicReportPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PlanoAlimentarPage from './pages/PlanoAlimentarPage';
import ConvitePage from './pages/ConvitePage';

// 3. Importar as páginas do app usando React.lazy
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProgressoPage = lazy(() => import('./pages/ProgressoPage'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage'));
const ConsultasPage = lazy(() => import('./pages/ConsultasPage'));
const MedicationPage = lazy(() => import('./pages/MedicationPage'));
const FoodDiaryPage = lazy(() => import('./pages/FoodDiaryPage'));
const ExamsPage = lazy(() => import('./pages/ExamsPage'));
const GastosPage = lazy(() => import('./pages/GastosPage'));
const ConquistasPage = lazy(() => import('./pages/ConquistasPage'));
const ConteudosPage = lazy(() => import('./pages/ConteudosPage'));
const ArtigoPage = lazy(() => import('./pages/ArtigoPage'));
const GanheRendaExtraPage = lazy(() => import('./pages/GanheRendaExtraPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HydrationPage = lazy(() => import('./pages/HydrationPage'));
const ReportCenterPage = lazy(() => import('./pages/ReportCenterPage'));


function App() {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUserStatus = useCallback(async () => {
        const token = localStorage.getItem('bariplus_token');
        if (token) {
            setAuthToken(token);
            try {
                const data = await fetchApi('/api/me');
                setUsuario(data);
            } catch (error) {
                setAuthToken(null);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        checkUserStatus();
    }, [checkUserStatus]);

    const handleLoginSuccess = (data) => {
        setAuthToken(data.token);
        setUsuario(data.user);
    };

    if (loading) {
        return <LoadingSpinner fullPage />;
    }

    return (
        <Router>
            <ToastContainer position="bottom-right" autoClose={4000} hideProgressBar={false} />
            {/* 4. Envolver TODAS as rotas com o componente Suspense */}
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                    {/* --- Grupo 1: Rotas Públicas e de Fluxo --- */}
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/login" element={!usuario ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
                    <Route path="/verify-email/:token?" element={<VerifyPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/termos" element={<TermsPage />} />
                    <Route path="/privacidade" element={<PrivacyPage />} />
                    <Route path="/planos" element={<PricingPage />} />
                    <Route path="/bem-vindo" element={<OnboardingPage />} />
                    <Route path="/payment/success" element={<PaymentSuccessPage />} />
                    <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                    <Route path="/relatorio/:token" element={<PublicReportPage />} />
                    <Route path="/convite/:codigo" element={<ConvitePage />} />

                    {/* --- Grupo 2: Rotas Principais da Aplicação (protegidas) --- */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute usuario={usuario}>
                                <Layout usuario={usuario} />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="hidratacao" element={<HydrationPage />} />
                        <Route path="progresso" element={<ProgressoPage />} />
                        <Route path="checklist" element={<ChecklistPage />} />
                        <Route path="consultas" element={<ConsultasPage />} />
                        <Route path="medicacao" element={<MedicationPage />} />
                        <Route path="diario-alimentar" element={<FoodDiaryPage />} />
                        <Route path="exames" element={<ExamsPage />} />
                        <Route path="gastos" element={<GastosPage />} />
                        <Route path="conquistas" element={<ConquistasPage />} />
                        <Route path="artigos" element={<ConteudosPage />} />
                        <Route path="artigos/:id" element={<ArtigoPage />} />
                        <Route path="ganhe-renda-extra" element={<GanheRendaExtraPage />} />
                        <Route path="relatorios" element={<ReportCenterPage />} />
                        <Route path="plano-alimentar" element={<PlanoAlimentarPage />} />
                        <Route path="perfil" element={<ProfilePage />} />
                    </Route>
                    
                    {/* --- Fallback --- */}
                    <Route path="*" element={<Navigate to="/landing" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;