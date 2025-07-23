import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api'; // Usando o nosso novo serviço de API

const EmailVerificationHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        toast.error('Link de verificação inválido.');
        return navigate('/login');
      }
      try {
        const response = await api.get(`/api/verify-email/${token}`);
        if (response.data.success) {
          toast.success('E-mail verificado com sucesso! Por favor, faça o login.');
          navigate('/login', { state: { justVerified: true } });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Link inválido ou expirado.');
        navigate('/login');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>A verificar o seu e-mail...</h2>
    </div>
  );
};

export default EmailVerificationHandler;