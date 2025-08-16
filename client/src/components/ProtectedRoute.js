import React from 'react';
import { Navigate } from 'react-router-dom';

// Este componente protege o layout principal da aplicação.
// Ele redireciona o utilizador para a etapa correta do fluxo se ele não estiver pronto.
const ProtectedRoute = ({ usuario, children }) => {
    // Se não há utilizador, manda para o login.
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }
    // Se o e-mail não foi verificado, manda para a página de verificação.
    if (!usuario.isEmailVerified) {
        return <Navigate to="/verify-email" state={{ email: usuario.email }} replace />;
    }
    // Se não pagou, manda para a página de planos.
    if (!usuario.pagamentoEfetuado) {
        return <Navigate to="/planos" replace />;
    }
    // Se não completou o onboarding, manda para a página de boas-vindas.
    if (!usuario.onboardingCompleto) {
        return <Navigate to="/bem-vindo" replace />;
    }

    // Se todos os testes passaram, o utilizador pode ver o conteúdo protegido.
    return children;
};

export default ProtectedRoute;