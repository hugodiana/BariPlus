import React from 'react';
import { Link } from 'react-router-dom';
// ✅ CORREÇÃO: O nome do arquivo CSS foi atualizado aqui
import './PaymentPages.css'; 

const PaymentCancelPage = () => {
    return (
        <div className="payment-page-container">
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