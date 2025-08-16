import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminLayout from './components/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UsersListPage from './pages/UsersListPage';
import ContentListPage from './pages/ContentListPage';
import ContentEditPage from './pages/ContentEditPage';
import SendNotificationPage from './pages/SendNotificationPage';

// Componente para proteger as rotas que exigem login
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('bariplus_admin_token');
    // Se não houver token, redireciona para a página de login
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <ToastContainer position="top-right" autoClose={4000} />
            <Routes>
                <Route path="/login" element={<AdminLoginPage />} />

                {/* Rota "pai" que protege todo o layout do admin */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Rotas "filhas" que serão renderizadas dentro do AdminLayout */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="users" element={<UsersListPage />} />
                    <Route path="content" element={<ContentListPage />} />
                    <Route path="content/new" element={<ContentEditPage />} />
                    <Route path="content/edit/:id" element={<ContentEditPage />} />
                    <Route path="notifications" element={<SendNotificationPage />} />
                    
                    {/* Se nenhuma rota filha for encontrada, redireciona para o dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;