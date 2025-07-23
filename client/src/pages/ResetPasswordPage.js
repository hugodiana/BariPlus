import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import './LoginPage.css'; // Reutilizando estilos

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        await api.get(`/api/validate-reset-token/${token}`);
        setIsValidToken(true);
      } catch (error) {
        toast.error('Link para redefinir senha é inválido ou expirou.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }
    try {
      await api.post('/api/reset-password', { token, password });
      toast.success('Senha redefinida com sucesso! Por favor, faça o login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao redefinir senha.");
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>A verificar o link...</div>;
  }

  return (
    isValidToken && (
      <div className="login-page-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Crie sua Nova Senha</h2>
          <input type="password" placeholder="Nova Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="password" placeholder="Confirme a Nova Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <button type="submit" className="submit-button">Redefinir Senha</button>
        </form>
      </div>
    )
  );
};

export default ResetPasswordPage;