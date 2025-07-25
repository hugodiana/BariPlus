import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import './PricingPage.css';
import { toast } from 'react-toastify';

const PricingPage = () => {
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [planType, setPlanType] = useState('anual'); // 'anual' ou 'mensal'

    // Lembre-se de adicionar REACT_APP_MERCADOPAGO_PUBLIC_KEY nas suas variáveis de ambiente
    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const createSubscriptionPreference = async () => {
        setLoading(true);
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${apiUrl}/api/create-subscription-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ planType: planType }), // Envia o tipo de plano escolhido
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao criar assinatura.');
            
            setPreferenceId(data.preferenceId);
        } catch (err) {
            toast.error(err.message);
            setLoading(false);
        }
    };
    
    // Detalhes dos planos
    const plans = {
        mensal: { title: "Plano Mensal", price: "R$ 49,99", term: "/mês" },
        anual: { title: "Plano Anual", price: "R$ 120,00", term: "/ano" }
    };
    const currentPlan = plans[planType];

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">Escolha o seu plano</h1>
                <p className="pricing-description">
                    Acesso completo e ilimitado a todas as ferramentas do BariPlus.
                </p>

                <div className="plan-toggle">
                    <button 
                        className={planType === 'mensal' ? 'active' : ''}
                        onClick={() => setPlanType('mensal')}
                    >
                        Mensal
                    </button>
                    <button 
                        className={planType === 'anual' ? 'active' : ''}
                        onClick={() => setPlanType('anual')}
                    >
                        Anual
                    </button>
                </div>
                
                <div className="price-tag">
                    <span className="price-amount">{currentPlan.price}</span>
                    <span className="price-term">{currentPlan.term}</span>
                </div>
                {planType === 'anual' && <span className="anual-benefit">Equivale a apenas R$ 10,00 por mês!</span>}
                
                <ul className="features-list">
                    <li>✓ Acompanhamento de Progresso Completo</li>
                    <li>✓ Controle de Medicação e Vitaminas</li>
                    <li>✓ Diário Alimentar e Checklist</li>
                    <li>✓ Acesso ao Portal de Afiliados</li>
                </ul>

                {!preferenceId ? (
                    <button className="checkout-button" onClick={createSubscriptionPreference} disabled={loading}>
                        {loading ? 'A gerar link...' : `Assinar Plano ${currentPlan.title}`}
                    </button>
                ) : (
                    <div className="mp-wallet-container">
                        <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingPage;