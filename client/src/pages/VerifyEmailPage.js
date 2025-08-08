import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../components/ui/Card';

const VerifyEmailPage = () => {
    const location = useLocation();
    const email = location.state?.email || '';
    const [loading, setLoading] = useState(false);
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleResend = async () => {
        if (!email) {
            return toast.error("E-mail não encontrado. Tente fazer o login novamente.");
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Erro ao reenviar e-mail.');
            }

            toast.success(data.message || 'E-mail de verificação reenviado com sucesso.');
        } catch (error) {
            toast.error(error.message || 'Erro ao reenviar e-mail.');
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="status-page-container">
                <Card className="status-card">
                    <h1>Erro</h1>
                    <p>Não foi possível identificar o seu e-mail. Por favor, tente fazer o login novamente.</p>
                    <Link to="/login" className="status-button">Voltar para o Login</Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="status-page-container">
            <Card className="status-card">
                <h1>Verifique o seu E-mail</h1>
                <p>Enviamos um link de verificação para <strong>{email}</strong>.</p>
                <p>Por favor, clique no link para ativar a sua conta. Não se esqueça de verificar a sua caixa de spam.</p>
                <button
                    onClick={handleResend}
                    disabled={loading}
                    className="status-button"
                >
                    {loading ? 'Reenviando...' : 'Reenviar link de verificação'}
                </button>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;
