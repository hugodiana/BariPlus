import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import './PricingPage.css';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const PricingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [afiliadoCode, setAfiliadoCode] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    useEffect(() => {
        const refCode = searchParams.get('afiliado');
        if (refCode) {
            setAfiliadoCode(refCode.toUpperCase());
            toast.info(`Cupom de afiliado ${refCode.toUpperCase()} aplicado!`);
        }
    }, [searchParams]);

    const onSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/process-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...formData, afiliadoCode }), // Envia os dados do cartão e o código do afiliado
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro no pagamento.');

            if (data.status === 'approved') {
                toast.success('Pagamento aprovado! Bem-vindo(a) ao BariPlus.');
                window.location.href = '/bem-vindo'; // Força o recarregamento
            } else {
                toast.warn(`O seu pagamento está ${data.status}. Avisaremos quando for aprovado.`);
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const precoFinal = afiliadoCode ? 109.99 * 0.70 : 109.99;

    return (
        <div className="pricing-page-container">
            <div className="pricing-card">
                <h1 className="pricing-title">BariPlus - Acesso Vitalício</h1>
                <p className="pricing-description">Acesso completo com um único pagamento.</p>
                <div className="price-tag">
                    {afiliadoCode && <span className="original-price">R$ 109.99</span>}
                    <span className="price-amount">R$ {precoFinal.toFixed(2)}</span>
                </div>
                <div className="coupon-display">
                    {afiliadoCode ? `Cupom aplicado: ${afiliadoCode}` : 'Insira os dados de pagamento abaixo'}
                </div>
                
                <div id="card-payment-container">
                    <CardPayment
                        initialization={{ amount: Number(precoFinal.toFixed(2)) }}
                        customization={{ paymentMethods: { maxInstallments: 12 } }}
                        onSubmit={onSubmit}
                        onError={(error) => console.error(error)}
                    />
                </div>
                {isLoading && <LoadingSpinner message="A processar o seu pagamento..." />}
            </div>
        </div>
    );
};

export default PricingPage;