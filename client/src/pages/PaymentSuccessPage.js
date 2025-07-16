import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PricingPage.css'; // Reutilizando o estilo

const PaymentSuccessPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Aguarda alguns segundos e redireciona para o onboarding
        setTimeout(() => {
            navigate('/bem-vindo');
        }, 4000);
    }, [navigate]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                <h2>Pagamento Aprovado!</h2>
                <p>Seja bem-vindo(a) ao BariPlus! Seu acesso foi liberado.</p>
                <p>Você será redirecionado em instantes para configurar seu perfil.</p>
                <div className="spinner"></div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;