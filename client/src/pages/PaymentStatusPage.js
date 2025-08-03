import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentStatusPage.css'; // Vamos criar este CSS a seguir
import Card from '../components/ui/Card';

const PaymentStatusPage = () => {
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
                <Link to="/login" className="status-button">
                    Ir para a Página de Login
                </Link>
            </Card>
        </div>
    );
};

export default PaymentStatusPage;