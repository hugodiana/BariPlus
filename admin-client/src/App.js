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

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('bariplus_admin_token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <>
            <ToastContainer position="top-right" autoClose={4000} />
            <Router>
                <Routes>
                    <Route path="/login" element={<AdminLoginPage />} />
                    <Route 
                        path="/" 
                        element={
                            <PrivateRoute>
                                <AdminLayout />
                            </PrivateRoute>
                        } 
                    >
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="users" element={<UsersListPage />} />
                        {/* ✅ CORREÇÃO: A rota mais específica vem primeiro */}
                        <Route path="content/new" element={<ContentEditPage />} /> 
                        <Route path="content/edit/:id" element={<ContentEditPage />} />
                        <Route path="content" element={<ContentListPage />} />
                        <Route path="/admin/notifications" element={<AdminLayout><SendNotificationPage /></AdminLayout>} />
                        {/* Redirecionamento para o dashboard caso nenhuma rota filha corresponda */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </>
    );
}

export default App;