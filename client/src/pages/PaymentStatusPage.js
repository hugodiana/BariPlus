import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PricingPage.css'; // Reutilizando o estilo

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processando'); // processando, sucesso, pendente, falha

    useEffect(() => {
        const paymentStatus = searchParams.get('status');

        if (paymentStatus === 'approved') {
            setStatus('sucesso');
            // Aguarda 4 segundos e redireciona para o onboarding
            setTimeout(() => navigate('/bem-vindo'), 4000);
        } else if (paymentStatus === 'pending') {
            setStatus('pendente');
        } else {
            setStatus('falha');
        }
    }, [searchParams, navigate]);

    return (
        <div className="pricing-page-container">
            <div className="feedback-card">
                {status === 'sucesso' && (
                    <>
                        <h2>Pagamento Aprovado!</h2>
                        <p>Seja bem-vindo(a) ao BariPlus! O seu acesso foi liberado.</p>
                        <p>Você será redirecionado em instantes para configurar seu perfil.</p>
                    </>
                )}
                {status === 'pendente' && (
                    <>
                        <h2>Pagamento Pendente</h2>
                        <p>O seu pagamento está a ser processado (isto é comum para boletos).</p>
                        <p>O seu acesso será liberado assim que recebermos a confirmação. Pode fechar esta página.</p>
                    </>
                )}
                {status === 'falha' && (
                    <>
                        <h2>Pagamento Falhou</h2>
                        <p>Ocorreu um problema com o seu pagamento. Por favor, tente novamente.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusPage;