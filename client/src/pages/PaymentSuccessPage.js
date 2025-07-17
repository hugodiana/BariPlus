import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PricingPage.css'; // Reutilizando o estilo

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('confirmando'); // 'confirmando', 'sucesso', 'falha'

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        if (sessionId) {
            const verifyPayment = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/verify-payment-session`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ sessionId })
                    });
                    const data = await response.json();

                    if (data.paymentVerified) {
                        setStatus('sucesso');
                        setTimeout(() => navigate('/bem-vindo'), 3000); // Redireciona após 3s
                    } else {
                        setStatus('falha');
                    }
                } catch (error) {
                    setStatus('falha');
                }
            };
            verifyPayment();
        } else {
            setStatus('falha');
        }
    }, [searchParams, navigate]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                {status === 'confirmando' && (
                    <>
                        <h2>A confirmar o seu pagamento...</h2>
                        <p>Por favor, aguarde um momento. Estamos a verificar tudo.</p>
                        <div className="spinner"></div>
                    </>
                )}
                {status === 'sucesso' && (
                    <>
                        <h2>Pagamento Aprovado!</h2>
                        <p>Seja bem-vindo(a) ao BariPlus! O seu acesso foi liberado.</p>
                        <p>Você será redirecionado em instantes para configurar o seu perfil.</p>
                    </>
                )}
                {status === 'falha' && (
                    <>
                        <h2>Ocorreu um Problema</h2>
                        <p>Não conseguimos confirmar o seu pagamento. Por favor, contacte o suporte se o valor foi debitado.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;