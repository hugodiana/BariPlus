import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { setAuthToken, fetchApi } from './utils/api';

// Layouts e Componentes de Rota
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Páginas Públicas e de Fluxo (sem menu lateral)
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

// Páginas do App (dentro do Layout)
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';
import FoodDiaryPage from './pages/FoodDiaryPage';
import ExamsPage from './pages/ExamsPage';
import GastosPage from './pages/GastosPage';
import ConquistasPage from './pages/ConquistasPage';
import ConteudosPage from './pages/ConteudosPage';
import ArtigoPage from './pages/ArtigoPage';
import GanheRendaExtraPage from './pages/GanheRendaExtraPage';
import ProfilePage from './pages/ProfilePage';
import HydrationPage from './pages/HydrationPage';
import ReportCenterPage from './pages/ReportCenterPage';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUserStatus = useCallback(async () => {
        const token = localStorage.getItem('bariplus_token');
        if (token) {
            setAuthToken(token);
            try {
                const res = await fetchApi('/api/me');
                if (res.ok) {
                    const data = await res.json();
                    setUsuario(data);
                } else {
                    setAuthToken(null);
                }
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
            <Routes>
                {/* --- Grupo 1: Rotas Públicas e de Fluxo (sempre acessíveis) --- */}
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
                    <Route path="perfil" element={<ProfilePage />} />
                </Route>
                
                {/* --- Fallback: Se nenhuma rota for encontrada, redireciona para a landing page --- */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
        </Router>
    );
}

export default App;