import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'; // ✅ MUDANÇA: Importamos o 'Payment' em vez do 'CardPayment'
import './PricingPage.css';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const PricingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [afiliadoCode, setAfiliadoCode] = useState('');
    
    // ✅ NOVIDADE: Estados para controlar o preço dinamicamente
    const [precoOriginal] = useState(109.99);
    const [precoFinal, setPrecoFinal] = useState(109.99);
    const [descontoAplicado, setDescontoAplicado] = useState(false);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    initMercadoPago(process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });

    // Preenche o código do afiliado se ele vier do link
    useEffect(() => {
        const refCode = searchParams.get('afiliado');
        if (refCode) {
            setAfiliadoCode(refCode.toUpperCase());
        }
    }, [searchParams]);

    // Função que lida com o envio do pagamento para o nosso back-end
    const onSubmit = async (formData) => {
        setIsLoading(true);
        try {
            // Enviamos os dados do cartão e também o código de afiliado
            const response = await fetch(`${apiUrl}/api/process-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...formData, afiliadoCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocorreu um erro no pagamento.');

            if (data.status === 'approved') {
                toast.success('Pagamento aprovado! Bem-vindo(a) ao BariPlus.');
                window.location.href = '/bem-vindo';
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
    
    // ✅ NOVIDADE: Função para o usuário aplicar o cupom e ver o desconto
    const handleApplyCoupon = () => {
        // A validação real é feita no back-end, aqui apenas atualizamos a UI
        if (afiliadoCode) {
            setPrecoFinal(precoOriginal * 0.70);
            setDescontoAplicado(true);
            toast.success("Desconto de afiliado aplicado!");
        } else {
            setPrecoFinal(precoOriginal);
            setDescontoAplicado(false);
            toast.info("Cupom removido.");
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

                {/* ✅ NOVIDADE: Campo de cupom visível com botão de aplicar */}
                <div className="coupon-section">
                    <input
                        type="text"
                        placeholder="CÓDIGO DE AFILIADO (OPCIONAL)"
                        value={afiliadoCode}
                        onChange={(e) => setAfiliadoCode(e.target.value.toUpperCase())}
                        className="coupon-input"
                    />
                    <button onClick={handleApplyCoupon} className="apply-coupon-btn">Aplicar</button>
                </div>
                
                <div id="payment-container">
                    {/* ✅ MUDANÇA: Usando o Brick 'Payment' que inclui todos os métodos */}
                    <Payment
                        initialization={{ amount: Number(precoFinal.toFixed(2)) }}
                        customization={{
                            visual: {
                                buttonBackground: 'primary',
                                buttonLabel: 'Pagar Agora',
                            },
                            paymentMethods: {
                                mercadoPago: 'all',
                                creditCard: 'all',
                                debitCard: 'all',
                                ticket: 'all', // Boleto
                                pix: 'all',
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