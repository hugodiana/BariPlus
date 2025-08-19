// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ nutricionista, children }) => {
    if (!nutricionista) {
        // Se não houver nutricionista logado, redireciona para a página de login
        return <Navigate to="/login" replace />;
    }

    // Se estiver logado, renderiza o conteúdo (o Layout com as páginas dentro)
    return children ? children : <Outlet />;
};

export default ProtectedRoute;