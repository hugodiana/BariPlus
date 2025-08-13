import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import './PaymentPages.css'; // Usaremos um novo CSS unificado

const PricingPage = () => {
    const kiwifyCheckoutLink = "https://pay.kiwify.com.br/SFeg1G8";

    return (
        <div className="payment-page-container">
            <Link to="/landing">
                <img src="/bariplus_logo.png" alt="BariPlus Logo" className="payment-page-logo" />
            </Link>
            <Card className="pricing-card">
                <div className="plan-badge">Acesso Vitalício</div>
                <h1 className="pricing-title">Um investimento único na sua saúde.</h1>
                <p className="pricing-description">
                    Todas as funcionalidades presentes e futuras do BariPlus, para sempre.
                </p>
                <div className="price-tag">
                    <span className="price-amount">R$ 109,99</span>
                </div>
                <p className="price-details">Pagamento único, sem mensalidades.</p>
                
                <a href={kiwifyCheckoutLink} className="checkout-button">
                    Garantir Meu Acesso Vitalício
                </a>
                
                <div className="secure-info">
                    <p>🔒 Pagamento 100% seguro processado pela Kiwify.</p>
                </div>
            </Card>
        </div>
    );
};

export default PricingPage;