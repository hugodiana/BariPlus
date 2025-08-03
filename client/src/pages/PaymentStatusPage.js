import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PaymentStatusPage.css';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentStatusPage = () => {
    const navigate = useNavigate();

    // ✅ NOVIDADE: Redireciona o usuário para o login após 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000); // 5 segundos

        // Limpa o temporizador se o componente for desmontado
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="status-page-container">
            <Card className="status-card">
                <div className="status-icon success">
                    <span>&#10003;</span>
                </div>
                <h1 className="status-title">Pagamento Aprovado!</h1>
                <p className="status-message">
                    Obrigado por se juntar ao BariPlus! O seu acesso está a ser liberado.
                </p>
                <p className="status-next-step">
                    Enviámos um e-mail para você com um link para **criar a sua senha** e aceder à sua nova conta. Por favor, verifique a sua caixa de entrada e spam.
                </p>
                <div className="redirect-notice">
                    <LoadingSpinner small />
                    <p>A redirecionar para a página de login em 5 segundos...</p>
                </div>
                <Link to="/login" className="status-button">
                    Ir para o Login Agora
                </Link>
            </Card>
        </div>
    );
};

export default PaymentStatusPage;