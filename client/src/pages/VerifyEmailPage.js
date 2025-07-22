import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css'; // Reutilizando os estilos da página de login

const VerifyEmailPage = () => {
    const location = useLocation();
    const email = location.state?.email; // Pega o email que passamos da página de cadastro
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleResendEmail = async () => {
        if (!email) {
            toast.error("Nenhum e-mail encontrado para reenviar o código.");
            return;
        }
        try {
            const response = await fetch(`${apiUrl}/api/resend-verification-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.info(data.message);
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro.");
        }
    };

    if (!email) {
        return (
            <div className="login-page-container">
                <div className="login-form-wrapper">
                    <h2>Algo deu errado</h2>
                    <p>Não conseguimos identificar o seu e-mail. Por favor, <Link to="/login">volte</Link> e tente se cadastrar novamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper" style={{ textAlign: 'center' }}>
                <h2>Quase lá! Verifique seu E-mail</h2>
                <p>Enviamos um link de ativação para o e-mail:</p>
                <p><strong>{email}</strong></p>
                <p>Por favor, clique no link para ativar a sua conta. Não se esqueça de verificar a sua pasta de spam.</p>
                <button type="button" className="link-button" onClick={handleResendEmail}>
                    Não recebeu o e-mail? Reenviar link.
                </button>
            </div>
        </div>
    );
};

export default VerifyEmailPage;