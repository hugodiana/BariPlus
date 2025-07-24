import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Extrai o token da query string
    const tokenParam = searchParams.get('token');
    console.log('Token recebido na URL:', tokenParam); // Log para debug
    
    if (!tokenParam) {
      toast.error('Link de redefinição inválido');
      navigate('/login');
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, [searchParams, navigate]);

  const validateToken = async (token) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/validate-reset-token/${encodeURIComponent(token)}`);
      
      if (response.data.valid) {
        setValidToken(true);
        setEmail(response.data.email);
      } else {
        toast.error(response.data.message || 'Link inválido ou expirado');
        navigate('/forgot-password');
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      toast.error('Erro ao validar link de redefinição');
      navigate('/forgot-password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/reset-password/${encodeURIComponent(token)}`, { password });
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Validando token...</div>;
  }

  if (!validToken) {
    return <div className="invalid-token">Validando link de redefinição...</div>;
  }

  return (
    <div className="reset-password-container">
      <h2>Redefinir Senha</h2>
      <p>Para: {email}</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nova Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="8"
          />
        </div>
        
        <div className="form-group">
          <label>Confirmar Nova Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processando...' : 'Redefinir Senha'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;