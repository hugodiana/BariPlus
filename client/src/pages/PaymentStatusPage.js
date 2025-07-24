import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PricingPage.css'; // Reutilizando o estilo
import LoadingSpinner from '../components/LoadingSpinner'; // Importando o spinner

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState('A confirmar o seu pagamento...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('status');
        const token = localStorage.getItem('bariplus_token');
        const apiUrl = process.env.REACT_APP_API_URL;

        if (status === 'approved' && paymentId) {
            // O pagamento foi aprovado, agora vamos verificar no nosso back-end
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
                            // Força o recarregamento da aplicação para que o App.js leia o novo status do usuário
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
    }, [searchParams, navigate]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                <h2>{isSuccess ? 'Sucesso!' : 'Aguarde...'}</h2>
                <p>{statusMessage}</p>
                {isSuccess && <div className="spinner"></div>}
            </div>
        </div>
    );
};

export default PaymentStatusPage;