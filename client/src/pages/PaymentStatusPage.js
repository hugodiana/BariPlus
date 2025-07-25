import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './PricingPage.css';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const [statusMessage, setStatusMessage] = useState('A confirmar o seu pagamento...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        if (status === 'approved' && paymentId) {
            const verifyOnServer = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/verify-payment/${paymentId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    
                    if (data.paymentVerified) {
                        setStatusMessage('Pagamento Aprovado! Seja bem-vindo(a) ao BariPlus.');
                        setIsSuccess(true);
                        setTimeout(() => {
                            // ✅ CORREÇÃO: Força o recarregamento para o App.js buscar o novo status
                            window.location.href = '/bem-vindo';
                        }, 3000);
                    } else {
                        throw new Error('Verificação falhou.');
                    }
                } catch (error) {
                    setStatusMessage('Ocorreu um problema ao confirmar seu pagamento. Por favor, contacte o suporte.');
                    setIsSuccess(false);
                }
            };
            verifyOnServer();
        } else if (status === 'pending') {
            setStatusMessage('O seu pagamento está pendente. Avisaremos quando for aprovado.');
            setIsSuccess(false);
        } else {
            setStatusMessage('O pagamento falhou ou foi cancelado. Por favor, tente novamente.');
            setIsSuccess(false);
        }
    }, [searchParams]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                <h2>{isSuccess ? 'Sucesso!' : 'Processando...'}</h2>
                <p>{statusMessage}</p>
                {isSuccess && <LoadingSpinner />}
            </div>
        </div>
    );
};

export default PaymentStatusPage;