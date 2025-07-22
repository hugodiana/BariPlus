import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './StaticPage.css'; // Reutilizando estilos

const VerifyPage = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('A verificar a sua conta...');
    const { token } = useParams();
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (token) {
            const verifyToken = async () => {
                try {
                    const response = await fetch(`${apiUrl}/api/verify-email/${token}`);
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message);
                    
                    setStatus('success');
                    setMessage(data.message);
                } catch (error) {
                    setStatus('error');
                    setMessage(error.message || "Ocorreu um erro.");
                }
            };
            verifyToken();
        }
    }, [token, apiUrl]);

    return (
        <div className="static-page-container">
            <div className="static-page-card" style={{ textAlign: 'center' }}>
                {status === 'verifying' && <h1>Aguarde...</h1>}
                {status === 'success' && <h1>Conta Ativada! ✅</h1>}
                {status === 'error' && <h1>Ocorreu um Erro ❌</h1>}
                
                <p style={{ fontSize: '1.2rem' }}>{message}</p>

                {status !== 'verifying' && (
                    <Link to="/login" className="back-link">Ir para o Login</Link>
                )}
            </div>
        </div>
    );
};

export default VerifyPage;