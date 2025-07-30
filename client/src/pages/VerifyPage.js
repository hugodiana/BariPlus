import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const VerifyPage = () => {
    // Esta página agora serve apenas como um ponto de carregamento
    // enquanto o back-end processa o token e faz o redirecionamento.
    const [message] = useState('A processar a sua verificação...');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <LoadingSpinner />
            <h2>{message}</h2>
            <p>Você será redirecionado em instantes.</p>
        </div>
    );
};

export default VerifyPage;