import React from 'react';
import './PricingPage.css';

const PricingPage = () => {
    // ✅ ESTE É O LINK DE CHECKOUT QUE VOCÊ PEGOU DA KIWIFY
    const kiwifyCheckoutLink = "https://pay.kiwify.com.br/SFeg1G8";

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">Todas as funcionalidades presentes e futuras, com um único pagamento seguro.</p>
                <div className="price-tag">
                    <span className="price-amount">R$ 109,99</span>
                </div>
                <p className="coupon-info">
                    Tem um cupom de afiliado? Ele será aplicado automaticamente se você acedeu pelo link do seu parceiro!
                </p>
                
                {/* O botão agora é um link direto para a Kiwify */}
                <a href={kiwifyCheckoutLink} className="checkout-button">
                    Comprar Agora
                </a>
                
                <div className="secure-logos">
                    <p>Pagamento 100% seguro processado pela Kiwify.</p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;