import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../pages/LoginPage.css'; // Reutilizando estilos

const VerifyEmailPage = () => {
    const location = useLocation();
    const email = location.state?.email;
    const [loading, setLoading] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleResend = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/resend-verification-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message);
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro.");
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="login-page-container">
                <div className="login-form-wrapper">
                    <h2>Erro</h2>
                    <p>Nenhum e-mail fornecido. Por favor, volte e tente fazer o login novamente.</p>
                    <Link to="/login">Voltar para o Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper" style={{ textAlign: 'center' }}>
                <h2>Verifique o seu E-mail</h2>
                <p>Enviamos um link de ativação para <strong>{email}</strong>.</p>
                <p>Por favor, verifique a sua caixa de entrada (e a de spam) e clique no link para ativar a sua conta.</p>
                <button onClick={handleResend} disabled={loading} className="submit-button">
                    {loading ? 'A reenviar...' : 'Reenviar E-mail de Verificação'}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmailPage;