// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ usuario, children }) => {
    // Se, após o carregamento, não houver usuário, vai para a landing.
    if (!usuario) {
        return <Navigate to="/landing" replace />;
    }

    // Se houver usuário, mas ele ainda não passou por uma das etapas,
    // o App.js irá redirecioná-lo. Se ele passou por tudo, renderiza o app.
    if (!usuario.isEmailVerified) {
        return <Navigate to="/verify-email" state={{ email: usuario.email }} replace />;
    }
    if (!usuario.pagamentoEfetuado) {
        return <Navigate to="/planos" replace />;
    }
    if (!usuario.onboardingCompleto) {
        return <Navigate to="/bem-vindo" replace />;
    }

    // Se chegou até aqui, o usuário está totalmente autenticado e configurado.
    return children;
};

export default ProtectedRoute;