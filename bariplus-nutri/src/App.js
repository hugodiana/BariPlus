// src/App.js
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { setAuthToken } from './utils/api';
import ProtectedRoute from './components/ProtectedRoute'; // Corrigido
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/LoadingSpinner'; // Adicionado para fallback

// Corrigido para usar os nomes de ficheiro corretos e lazy loading
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PacientesPage = lazy(() => import('./pages/PacientesPage'));
const PacienteDetailPage = lazy(() => import('./pages/PacienteDetailPage'));
const PlanoAlimentarPage = lazy(() => import('./pages/PlanoAlimentarPage'));
const PlanoDetailPage = lazy(() => import('./pages/PlanoDetailPage'));
const CriarPacientePage = lazy(() => import('./pages/CriarPacientePage'));
const ProntuarioPage = lazy(() => import('./pages/ProntuarioPage'));
const AgendaPage = lazy(() => import('./pages/AgendaPage'));
const AssinaturaPage = lazy(() => import('./pages/AssinaturaPage'));

function App() {
    const [nutricionista, setNutricionista] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = () => {
            const token = localStorage.getItem('nutri_token');
            if (token) {
                setAuthToken(token);
                try {
                    const savedNutri = localStorage.getItem('nutri_data');
                    if (savedNutri) {
                        setNutricionista(JSON.parse(savedNutri));
                    } else {
                        // Se não houver dados, limpa o token para forçar o login
                        setAuthToken(null);
                    }
                } catch (error) {
                    setAuthToken(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleLoginSuccess = (nutriData) => {
        setNutricionista(nutriData);
        localStorage.setItem('nutri_data', JSON.stringify(nutriData));
    };

    if (loading) return <LoadingSpinner fullPage />;

    return (
        <Router>
            <ToastContainer position="bottom-right" />
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                    <Route path="/login" element={!nutricionista ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
                    
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute nutricionista={nutricionista}>
                                <Layout nutricionista={nutricionista} />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="pacientes" element={<PacientesPage />} />
                        <Route path="prontuario/:pacienteId" element={<ProntuarioPage />} />
                        <Route path="paciente/:pacienteId" element={<PacienteDetailPage />} />
                        <Route path="paciente/:pacienteId/plano/criar" element={<PlanoAlimentarPage />} />
                        <Route path="pacientes/criar" element={<CriarPacientePage />} />
                        <Route path="agenda" element={<AgendaPage />} />
                        <Route path="assinatura" element={<AssinaturaPage />} />
                        <Route path="paciente/:pacienteId/plano/:planoId" element={<PlanoDetailPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;