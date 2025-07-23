import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import './PricingPage.css';

const PricingPage = () => {
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ INICIALIZAÇÃO: Use a sua Public Key do Mercado Pago
    // Lembre-se de adicionar REACT_APP_MERCADOPAGO_PUBLIC_KEY nas suas variáveis de ambiente
    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const createPaymentPreference = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${apiUrl}/api/create-payment-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Guarda o ID da preferência para o botão de pagamento usar
                setPreferenceId(data.preferenceId);
            } else {
                throw new Error(data.message || 'Falha ao criar preferência de pagamento.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">
                    Adquira acesso completo e permanente a todas as funcionalidades do BariPlus com um único pagamento.
                </p>
                <div className="price-tag">
                    <span className="price-amount">R$ 79,99</span>
                    <span className="price-term">Pagamento Único</span>
                </div>
                <ul className="features-list">
                    <li>✓ Painel de Controle Inteligente</li>
                    <li>✓ Checklist Pré e Pós-Operatório</li>
                    <li>✓ Registro de Progresso com Fotos e Medidas</li>
                    <li>✓ Diário Alimentar com Consulta Nutricional</li>
                </ul>
                
                {/* O botão de pagamento agora é condicional */}
                {!preferenceId ? (
                    <button className="checkout-button" onClick={createPaymentPreference} disabled={loading}>
                        {loading ? 'Aguarde...' : 'Ir para o Pagamento'}
                    </button>
                ) : (
                    // O componente <Wallet> renderiza o botão de pagamento do Mercado Pago
                    <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                )}

                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default PricingPage;