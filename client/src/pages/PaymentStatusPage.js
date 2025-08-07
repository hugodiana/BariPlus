import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PaymentStatusPage.css';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentStatusPage = () => {
    const navigate = useNavigate();

    // Redireciona o usuário para o login após 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000); // 5 segundos

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
                    Obrigado por se juntar ao BariPlus! O seu acesso foi liberado.
                </p>
                <p className="status-next-step">
                    Enviámos um e-mail de boas-vindas para você. Agora, basta fazer o login com a sua conta.
                </p>
                <div className="redirect-notice">
                    <LoadingSpinner small />
                    <p>A redirecionar para a página de login em 5 segundos...</p>
                </div>
                <Link to="/login" className="status-button">
                    Fazer Login Agora
                </Link>
            </Card>
        </div>
    );
};

export default PaymentStatusPage;