import React, { useState } from 'react';
import './PricingPage.css';
import { loadStripe } from '@stripe/stripe-js';


// ✅ CORREÇÃO: Verificamos se a chave existe antes de carregar o Stripe
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
let stripePromise;
if (stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
}

const PricingPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        // ✅ CORREÇÃO: Mostra um erro amigável se a chave não foi carregada
        if (!stripePromise) {
            setError("A configuração de pagamento não foi carregada corretamente. Por favor, contacte o suporte.");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${apiUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const session = await response.json();

            if (response.ok) {
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({
                    sessionId: session.id,
                });
                if (error) throw new Error(error.message);
            } else {
                throw new Error(session.error?.message || 'Falha ao iniciar o pagamento.');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">
                    Adquira acesso completo e permanente a todas as ferramentas e funcionalidades do BariPlus com um único pagamento.
                </p>
                <div className="price-tag">
                    <span className="price-amount">R$ 49,90</span>
                    <span className="price-term">Pagamento Único</span>
                </div>
                <ul className="features-list">
                    <li>✓ Painel de Controle Inteligente</li>
                    <li>✓ Checklist Pré e Pós-Operatório</li>
                    <li>✓ Registro de Progresso com Fotos e Medidas</li>
                    <li>✓ Diário Alimentar com Consulta Nutricional</li>
                    <li>✓ Todas as futuras atualizações</li>
                </ul>
                <button className="checkout-button" onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Aguarde...' : 'Comprar Acesso Agora'}
                </button>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default PricingPage;