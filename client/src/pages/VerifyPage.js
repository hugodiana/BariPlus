import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const VerifyPage = () => {
    const { token } = useParams();
    const [message, setMessage] = useState('A verificar o seu e-mail...');
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const res = await fetch(`${apiUrl}/api/verify-email/${token}`);
                if (!res.ok) throw new Error();
                setMessage("E-mail verificado com sucesso! Agora você já pode fazer o login.");
            } catch (error) {
                setMessage("Link de verificação inválido ou expirado. Por favor, tente se cadastrar novamente.");
            }
        };
        verifyToken();
    }, [token, apiUrl]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>{message}</h2>
            <Link to="/login">Voltar para o Login</Link>
        </div>
    );
};
export default VerifyPage;