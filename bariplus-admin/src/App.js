// src/App.js
import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './components/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner'; // Importe o LoadingSpinner

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminPacientesPage = lazy(() => import('./pages/AdminPacientesPage'));
const AdminNutricionistasPage = lazy(() => import('./pages/AdminNutricionistasPage'));
const AdminPacienteDetailPage = lazy(() => import('./pages/AdminPacienteDetailPage'));
const AdminNutricionistaDetailPage = lazy(() => import('./pages/AdminNutricionistaDetailPage'));
function App() {
    const [isAdminAuth, setIsAdminAuth] = useState(!!localStorage.getItem('admin_token'));

    const handleLogin = () => {
        setIsAdminAuth(true);
    };

    // Função para ser passada para o AdminLayout
    const handleLogout = () => {
        setIsAdminAuth(false);
    };

    return (
        <Router>
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                    <Route 
                        path="/login" 
                        element={!isAdminAuth ? <AdminLoginPage onLoginSuccess={handleLogin} /> : <Navigate to="/" />} 
                    />
                    <Route 
                        path="/*" // CORREÇÃO: Usar um coringa para rotas protegidas
                        element={
                            isAdminAuth ? 
                            <AdminLayout onLogout={handleLogout} /> : 
                            <Navigate to="/login" />
                        }
                    >
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="pacientes" element={<AdminPacientesPage />} />
                        <Route path="pacientes/:id" element={<AdminPacienteDetailPage />} />
                        <Route path="nutricionistas" element={<AdminNutricionistasPage />} />
                        <Route path="nutricionistas/:id" element={<AdminNutricionistaDetailPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;