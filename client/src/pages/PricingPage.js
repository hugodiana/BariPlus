import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
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

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    const handleApplyCoupon = async (codeToValidate) => {
        // Usa o código passado como argumento ou o estado atual
        const code = (typeof codeToValidate === 'string') ? codeToValidate : afiliadoCode;
        if (!code) {
            setPrecoFinal(precoOriginal);
            setDescontoAplicado(false);
            return; // Sai da função se não houver código
        }
        
        try {
            const response = await fetch(`${apiUrl}/api/validate-coupon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ afiliadoCode: code }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setPrecoFinal(precoOriginal * 0.70);
            setDescontoAplicado(true);
            toast.success("Cupom de afiliado aplicado!");

        } catch (error) {
            setPrecoFinal(precoOriginal);
            setDescontoAplicado(false);
            toast.error(error.message || "Cupom inválido.");
        }
    };
    
    useEffect(() => {
        const refCode = searchParams.get('afiliado');
        if (refCode) {
            const code = refCode.toUpperCase();
            setAfiliadoCode(code);
            // Chama a função para validar o cupom que veio do link
            handleApplyCoupon(code);
        }
    }, [searchParams]);
    
    const onSubmit = async (formData) => {
        setIsLoading(true);
        try {
            // Envia o código de afiliado apenas se o desconto estiver aplicado
            const codeToSubmit = descontoAplicado ? afiliadoCode : '';
            
            const response = await fetch(`${apiUrl}/api/process-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...formData, afiliadoCode: codeToSubmit }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            if (data.status === 'approved') {
                toast.success('Pagamento aprovado! Bem-vindo(a) ao BariPlus.');
                window.location.href = '/bem-vindo';
            } else {
                toast.warn(`O seu pagamento está ${data.status}.`);
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <button onClick={() => handleApplyCoupon()} className="apply-coupon-btn">Aplicar</button>
                </div>
                
                <div id="payment-container">
                    <Payment
                        initialization={{
                            amount: Number(precoFinal.toFixed(2)),
                        }}
                        customization={{
                            paymentMethods: {
                                ticket: "all",
                                bankTransfer: "all", // Inclui PIX
                                creditCard: "all",
                                debitCard: "all",
                                mercadoPago: "all",
                            },
                        }}
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