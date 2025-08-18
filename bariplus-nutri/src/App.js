import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { setAuthToken, fetchApi } from './utils/api';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PacientesPage = lazy(() => import('./pages/PacientesPage'));

function App() {
    const [nutricionista, setNutricionista] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('nutri_token');
            if (token) {
                setAuthToken(token);
                try {
                    // Precisamos de uma rota no backend que retorne os dados do nutri logado
                    // Por agora, vamos assumir que o login guarda os dados no localStorage
                    const savedNutri = localStorage.getItem('nutri_data');
                    if (savedNutri) setNutricionista(JSON.parse(savedNutri));

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

    if (loading) return <div>A carregar...</div>;

    return (
        <Router>
            <ToastContainer position="bottom-right" />
            <Suspense fallback={<div>A carregar página...</div>}>
                <Routes>
                    <Route path="/login" element={!nutricionista ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
                    <Route path="/" element={nutricionista ? <Layout nutricionista={nutricionista} /> : <Navigate to="/login" />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="pacientes" element={<PacientesPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;