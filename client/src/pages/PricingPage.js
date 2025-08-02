import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'; // ✅ MUDANÇA: Voltamos ao Wallet Brick, que é o mais indicado para este fluxo
import './PricingPage.css';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const PricingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [afiliadoCode, setAfiliadoCode] = useState('');
    
    const [precoOriginal] = useState(109.99);
    const [precoFinal, setPrecoFinal] = useState(109.99);
    const [descontoAplicado, setDescontoAplicado] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const handleCreatePreference = async () => {
        setIsLoading(true);
        setPreferenceId(null);
        
        try {
            const response = await fetch(`${apiUrl}/api/create-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ afiliadoCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setFinalPrice(data.finalPrice);
            if (data.finalPrice < precoOriginal) {
                setDescontoAplicado(true);
                toast.success("Cupom de afiliado aplicado!");
            } else {
                setDescontoAplicado(false);
                if (afiliadoCode) toast.warn("O cupom inserido não é válido.");
            }
            setPreferenceId(data.preferenceId);
        } catch (err) {
            toast.error(err.message || 'Falha ao processar o cupom.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const refCode = searchParams.get('afiliado');
        if (refCode) {
            setAfiliadoCode(refCode.toUpperCase());
        }
    }, [searchParams]);

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">Acesso completo com um único pagamento.</p>
                <div className="price-tag">
                    {descontoAplicado && <span className="original-price">R$ {precoOriginal.toFixed(2)}</span>}
                    <span className="price-amount">R$ {precoFinal.toFixed(2)}</span>
                </div>

                <div className="coupon-section">
                    <input
                        type="text"
                        placeholder="CÓDIGO DE AFILIADO (OPCIONAL)"
                        value={afiliadoCode}
                        onChange={(e) => setAfiliadoCode(e.target.value.toUpperCase())}
                        className="coupon-input"
                    />
                </div>
                
                {preferenceId ? (
                    <div className="wallet-container">
                        <p>Clique abaixo para finalizar o pagamento de forma segura com o Mercado Pago.</p>
                        <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                    </div>
                ) : (
                    <button className="checkout-button" onClick={handleCreatePreference} disabled={isLoading}>
                        {isLoading ? 'A verificar...' : 'Comprar Agora e Ver Desconto'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PricingPage;