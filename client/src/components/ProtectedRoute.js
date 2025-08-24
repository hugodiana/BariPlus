// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Se não está autenticado, manda para o login guardando a página que ele tentou aceder.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Se a rota exige onboarding e o usuário não o completou, manda para o onboarding.
    if (requireOnboarding && !user.onboardingCompleto) {
        return <Navigate to="/onboarding" replace />;
    }

    // Se a rota é o onboarding, mas o usuário já completou, manda para o dashboard.
    if (!requireOnboarding && user.onboardingCompleto) {
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;