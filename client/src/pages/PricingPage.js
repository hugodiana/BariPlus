import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import './PricingPage.css';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const PricingPage = () => {
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null); // 'lifetime' ou 'annual'
    const [preferenceId, setPreferenceId] = useState(null);

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const createPreference = async (plan) => {
        setLoading(true);
        setSelectedPlan(plan); // Guarda o plano selecionado
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;
        
        try {
            const response = await fetch(`${apiUrl}/api/create-payment-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ planType: plan, couponCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setPreferenceId(data.preferenceId); // Abre o modal com o botão de pagamento
        } catch (err) {
            toast.error(err.message || 'Falha ao processar cupom.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-header">
                <h1>Escolha o seu plano</h1>
                <p>Tenha acesso ilimitado a todas as ferramentas do BariPlus.</p>
            </div>
            <div className="pricing-grid">
                {/* Card do Plano Anual */}
                <div className="pricing-card">
                    <h2 className="plan-title">Assinatura Anual</h2>
                    <div className="price-tag"><span className="price-amount">R$ 49,99</span>/ano</div>
                    <ul className="features-list">
                        <li>✓ Todas as funcionalidades</li>
                        <li>✓ Acesso por 12 meses</li>
                        <li>✓ Suporte prioritário</li>
                    </ul>
                    <button className="checkout-button" onClick={() => createPreference('annual')} disabled={loading}>
                        Assinar Plano Anual
                    </button>
                </div>

                {/* Card do Plano Vitalício */}
                <div className="pricing-card highlighted">
                    <span className="highlight-badge">Mais Popular</span>
                    <h2 className="plan-title">Acesso Vitalício</h2>
                    <div className="price-tag"><span className="price-amount">R$ 79,99</span>/pagamento único</div>
                    <ul className="features-list">
                        <li>✓ Todas as funcionalidades</li>
                        <li>✓ Acesso PARA SEMPRE</li>
                        <li>✓ Todas as futuras atualizações</li>
                    </ul>
                    <button className="checkout-button" onClick={() => createPreference('lifetime')} disabled={loading}>
                        Comprar Acesso Vitalício
                    </button>
                </div>
            </div>

            <div className="coupon-section">
                <input
                    type="text"
                    placeholder="Tem um cupom de afiliado?"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="coupon-input"
                />
            </div>
            
            <Modal isOpen={!!preferenceId} onClose={() => setPreferenceId(null)}>
                <div className="payment-modal-content">
                    <h3>Finalize o seu Pagamento</h3>
                    <p>Você está prestes a adquirir o plano {selectedPlan === 'lifetime' ? 'Vitalício' : 'Anual'}.</p>
                    <p>Clique abaixo para pagar de forma segura com o Mercado Pago (aceita Cartão, Pix e Boleto).</p>
                    {preferenceId && (
                        <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PricingPage;