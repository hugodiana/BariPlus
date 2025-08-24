// client/src/components/AuthRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        // Se o usuário já está logado, redireciona para o dashboard
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default AuthRoute;