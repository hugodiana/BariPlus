import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './PaymentPages.css'; // Usando o mesmo CSS unificado

const PaymentStatusPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 8000); // 8 segundos

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="payment-page-container">
            <Card className="status-card">
                <div className="status-icon success">
                    <span>&#10003;</span>
                </div>
                <h1 className="status-title">Pagamento Aprovado!</h1>
                <p className="status-message">
                    Seja bem-vindo(a) à família BariPlus! O seu acesso foi liberado.
                </p>
                <div className="status-next-step">
                    <p><strong>Próximo passo:</strong> Enviámos um e-mail de boas-vindas com as instruções para você configurar a sua senha e aceder ao aplicativo.</p>
                </div>
                <div className="redirect-notice">
                    <p>A redirecionar para a página de login...</p>
                </div>
                <Link to="/login" className="checkout-button">
                    Ir para o Login
                </Link>
            </Card>
        </div>
    );
};

export default PaymentStatusPage;