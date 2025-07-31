import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import './PricingPage.css';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

const PricingPage = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [afiliadoCode, setAfiliadoCode] = useState('');
    const [finalPrice, setFinalPrice] = useState(109.99);
    const [discountApplied, setDiscountApplied] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    useEffect(() => {
        const refCode = searchParams.get('afiliado');
        if (refCode) {
            setAfiliadoCode(refCode.toUpperCase());
        }
    }, [searchParams]);

    const handleCreatePreference = async () => {
        setLoading(true);
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;
        
        try {
            const response = await fetch(`${apiUrl}/api/create-payment-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ planType: 'lifetime', afiliadoCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setFinalPrice(data.finalPrice);
            if (data.finalPrice < 109.99) {
                setDiscountApplied(true);
                toast.success("Cupom de afiliado aplicado com sucesso!");
            }
            setPreferenceId(data.preferenceId); // Abre o modal
        } catch (err) {
            toast.error(err.message || 'Falha ao processar o cupom.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pricing-page-container">
            <div className="pricing-card highlighted">
                <span className="highlight-badge">Recomendado</span>
                <h1 className="plan-title">Acesso Vitalício</h1>
                <p className="pricing-description">Todas as funcionalidades presentes e futuras, para sempre.</p>
                
                <div className="price-tag">
                    {discountApplied && <span className="original-price">R$ 109,99</span>}
                    <span className="price-amount">R$ {finalPrice.toFixed(2)}</span>
                </div>
                
                <div className="coupon-section">
                    <input
                        type="text"
                        placeholder="CÓDIGO DE AFILIADO"
                        value={afiliadoCode}
                        onChange={(e) => setAfiliadoCode(e.target.value.toUpperCase())}
                        className="coupon-input"
                    />
                </div>

                <button className="checkout-button" onClick={handleCreatePreference} disabled={loading}>
                    {loading ? 'Aguarde...' : 'Comprar Agora'}
                </button>
            </div>
            
            <Modal isOpen={!!preferenceId} onClose={() => setPreferenceId(null)}>
                <div className="payment-modal-content">
                    <h3>Finalize o seu Pagamento</h3>
                    <p>Você está adquirindo o Acesso Vitalício por <strong>R$ {finalPrice.toFixed(2)}</strong>.</p>
                    <p>Pague de forma segura com o Mercado Pago (aceita Cartão, Pix e Boleto).</p>
                    {preferenceId && (
                        <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PricingPage;