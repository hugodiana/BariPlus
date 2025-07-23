import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ usuario, children }) => {
    const location = useLocation();

    if (!usuario) {
        // Se não houver usuário, redireciona para a landing page
        return <Navigate to="/landing" replace />;
    }

    if (!usuario.isEmailVerified) {
        // Se o e-mail não for verificado, redireciona para a página de verificação
        return <Navigate to="/verify-email" state={{ email: usuario.email }} replace />;
    }

    if (!usuario.pagamentoEfetuado) {
        // Se não houver pagamento, redireciona para os planos
        return <Navigate to="/planos" replace />;
    }

    if (!usuario.onboardingCompleto) {
        // Se o onboarding não estiver completo, redireciona para a página de boas-vindas
        return <Navigate to="/bem-vindo" replace />;
    }

    // Se todas as verificações passarem, mostra a página solicitada
    return children;
};

export default ProtectedRoute;