import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import './PricingPage.css';
import { toast } from 'react-toastify';

const PricingPage = () => {
    const [preferenceId, setPreferenceId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [finalPrice, setFinalPrice] = useState(79.99);
    const [discountApplied, setDiscountApplied] = useState(false);

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const handleApplyCouponAndCreatePreference = async () => {
        setLoading(true);
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;
        
        try {
            const response = await fetch(`${apiUrl}/api/validate-and-create-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ couponCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setPreferenceId(data.preferenceId);
            setFinalPrice(data.finalPrice);
            if (data.discountApplied) {
                toast.success("Cupom de afiliado aplicado com sucesso!");
                setDiscountApplied(true);
            }
        } catch (err) {
            toast.error(err.message || 'Falha ao processar cupom.');
            setPreferenceId(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">Acesso completo com um único pagamento.</p>
                
                <div className="price-tag">
                    {discountApplied && <span className="original-price">R$ 79,99</span>}
                    <span className="price-amount">R$ {finalPrice.toFixed(2)}</span>
                </div>
                
                {!preferenceId ? (
                    <div className="coupon-and-buy-section">
                        <div className="coupon-container">
                            <input
                                type="text"
                                placeholder="Código de Cupom (opcional)"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="coupon-input"
                            />
                        </div>
                        <button className="checkout-button" onClick={handleApplyCouponAndCreatePreference} disabled={loading}>
                            {loading ? 'Aguarde...' : 'Aplicar Cupom e Pagar'}
                        </button>
                    </div>
                ) : (
                    <div className="wallet-container">
                        <p>Prossiga com o pagamento seguro via Mercado Pago.</p>
                        <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                    </div>
                )}
            </div>
        </div>
    );
};
export default PricingPage;