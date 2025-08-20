// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ auth, children }) => {
    // Se não está autenticado, manda para o login.
    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Se está autenticado mas não completou o onboarding, manda para o onboarding.
    if (!auth.user.onboardingCompleto) {
        return <Navigate to="/onboarding" replace />;
    }
    
    // Se está autenticado E com onboarding completo, renderiza o conteúdo protegido.
    return children ? children : <Outlet />;
};

export default ProtectedRoute;