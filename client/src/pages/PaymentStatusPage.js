import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PricingPage.css';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState('A confirmar o seu pagamento...');
    const [isSuccess, setIsSuccess] = useState(null); // null | true | false

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        const verifyPayment = async () => {
            if (status === 'approved' && paymentId && token) {
                try {
                    const response = await fetch(`${apiUrl}/api/verify-payment/${paymentId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    
                    if (data.paymentVerified) {
                        setStatusMessage('Pagamento Aprovado! A preparar o seu onboarding...');
                        setIsSuccess(true);
                        setTimeout(() => window.location.href = '/bem-vindo', 3000);
                    } else {
                        throw new Error('Verificação falhou.');
                    }
                } catch (error) {
                    setStatusMessage('Ocorreu um problema ao confirmar o seu pagamento. Por favor, contacte o suporte.');
                    setIsSuccess(false);
                }
            } else if (status === 'pending') {
                setStatusMessage('O seu pagamento está pendente. Avisaremos quando for aprovado.');
                setIsSuccess(false);
            } else {
                setStatusMessage('O pagamento falhou ou foi cancelado. Por favor, tente novamente.');
                setIsSuccess(false);
            }
        };
        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                {isSuccess === null && <LoadingSpinner />}
                {isSuccess !== null && (
                    <>
                        <h2>{isSuccess ? 'Sucesso!' : 'Atenção'}</h2>
                        <p>{statusMessage}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusPage;