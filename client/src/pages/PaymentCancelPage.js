import React from 'react';
import { Link } from 'react-router-dom';
import './PricingPage.css'; // Reutilizando o estilo

const PaymentCancelPage = () => {
    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                <h2>Pagamento Cancelado</h2>
                <p>A sua sessão de pagamento foi cancelada ou expirou.</p>
                <p>Você pode tentar novamente quando quiser.</p>
                <Link to="/planos" className="checkout-button">
                    Tentar Novamente
                </Link>
            </div>
        </div>
    );
};

export default PaymentCancelPage;