import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { toast } from 'react-toastify';
import './PricingPage.css';

const PricingPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    
    // ✅ INICIALIZAÇÃO: Use a sua Public Key do Mercado Pago
    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    
    // Função chamada quando o formulário é submetido
    const onSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/process-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro no pagamento.');
            }

            if (data.status === 'approved') {
                toast.success('Pagamento aprovado! Bem-vindo(a) ao BariPlus.');
                // Força o recarregamento da aplicação para o App.js ler o novo status
                window.location.href = '/bem-vindo';
            } else {
                toast.warn(`O seu pagamento está ${data.status}. Avisaremos quando for aprovado.`);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Personalização do Brick de Pagamento
    const initialization = {
        amount: 79.99, // O valor do produto
    };
    const customization = {
        paymentMethods: {
            maxInstallments: 1, // Limita a 1 parcela para pagamento único
        },
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">Acesso completo com um único pagamento.</p>
                <div className="price-tag">
                    <span className="price-amount">R$ 79,99</span>
                </div>
                
                {/* ✅ O formulário de pagamento agora é o componente CardPayment */}
                <div id="card-payment-container">
                    <CardPayment
                        initialization={initialization}
                        customization={customization}
                        onSubmit={onSubmit}
                        onError={(error) => console.error(error)}
                        onReady={() => console.log('Brick de Cartão pronto!')}
                    />
                </div>
                {isLoading && <div className="loading-overlay">A processar o seu pagamento...</div>}
            </div>
        </div>
    );
};

export default PricingPage;