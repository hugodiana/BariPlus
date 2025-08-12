import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ usuario, children }) => {
    const location = useLocation();

    // Se não houver usuário, redireciona para a landing page,
    // guardando a página que ele tentou visitar para um possível redirecionamento futuro.
    if (!usuario) {
        return <Navigate to="/landing" state={{ from: location }} replace />;
    }

    // Se o usuário existir, mas ainda não tiver passado por uma das etapas,
    // o React Router irá redirecioná-lo com base nas regras do App.js.
    // Se passou por tudo, renderiza a página solicitada.
    return children;
};

export default ProtectedRoute;