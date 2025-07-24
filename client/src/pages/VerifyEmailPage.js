// client/src/pages/VerifyEmailPage.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css'; // Reutilizando estilos

const VerifyEmailPage = () => {
    const [code, setCode] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const apiUrl = process.env.REACT_APP_API_URL;
        try {
            const response = await fetch(`${apiUrl}/api/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro.");
        }
    };

    if (!email) {
        return <div className="login-page-container">Página inválida. Por favor, <a href="/login">cadastre-se</a> novamente.</div>;
    }

    return (
        <div className="login-page-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Verifique seu E-mail</h2>
                <p>Enviamos um código de 6 dígitos para <strong>{email}</strong>. Por favor, insira-o abaixo.</p>
                <input
                    type="text"
                    maxLength="6"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="_ _ _ _ _ _"
                    required
                    className="verification-code-input"
                />
                <button type="submit" className="submit-button">Verificar</button>
            </form>
        </div>
    );
};
export default VerifyEmailPage;