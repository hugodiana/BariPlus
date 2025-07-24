// client/src/pages/PaymentStatusPage.js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PricingPage.css';

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const [statusMessage, setStatusMessage] = useState('A confirmar o seu pagamento...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        if (sessionId && token) {
            const verifyOnServer = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/verify-payment-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ sessionId })
                    });
                    const data = await response.json();
                    if (data.paymentVerified) {
                        setStatusMessage('Pagamento Aprovado! Seja bem-vindo(a)!');
                        setIsSuccess(true);
                        setTimeout(() => window.location.href = '/bem-vindo', 3000);
                    } else {
                        throw new Error('Verificação falhou.');
                    }
                } catch (error) {
                    setStatusMessage('Ocorreu um problema ao confirmar seu pagamento. Por favor, contacte o suporte.');
                    setIsSuccess(false);
                }
            };
            verifyOnServer();
        } else {
            setStatusMessage('Informações de pagamento não encontradas. Por favor, tente novamente.');
            setIsSuccess(false);
        }
    }, [searchParams]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                <h2>{isSuccess ? 'Sucesso!' : 'Processando...'}</h2>
                <p>{statusMessage}</p>
            </div>
        </div>
    );
};
export default PaymentStatusPage;