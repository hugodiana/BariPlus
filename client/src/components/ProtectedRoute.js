import React from 'react';
import { Navigate } from 'react-router-dom';

// Este componente agora apenas protege o layout principal da aplicação.
// Ele redireciona o usuário para a etapa correta do fluxo se eles não estiverem prontos.
const ProtectedRoute = ({ usuario, children }) => {
    // Se não há usuário, manda para o login.
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }
    // Se o e-mail não foi verificado, manda para a página de verificação.
    if (!usuario.isEmailVerified) {
        return <Navigate to="/verify-email" replace state={{ email: usuario.email }} />;
    }
    // Se não pagou, manda para a página de planos.
    if (!usuario.pagamentoEfetuado) {
        return <Navigate to="/planos" replace />;
    }
    // Se não completou o onboarding, manda para a página de boas-vindas.
    if (!usuario.onboardingCompleto) {
        return <Navigate to="/bem-vindo" replace />;
    }

    // Se todos os testes passaram, o usuário pode ver o conteúdo protegido (o app principal).
    return children;
};

export default ProtectedRoute;