import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      toast.error('Link de redefinição inválido ou expirado');
      navigate('/login');
      return;
    }

    validateResetToken(tokenParam);
  }, [searchParams, navigate]);

  const validateResetToken = async (token) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/auth/validate-reset-token/${encodeURIComponent(token)}`);
      
      if (response.data.valid) {
        setFormData(prev => ({ ...prev, token, email: response.data.email }));
        setIsTokenValid(true);
      } else {
        toast.error(response.data.message || 'Token inválido ou expirado');
        navigate('/forgot-password');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      toast.error(error.response?.data?.message || 'Erro ao validar token');
      navigate('/forgot-password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', {
        token: formData.token,
        newPassword: formData.password
      });
      
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="reset-password-container">
        <div className="loading-state">
          <p>Validando seu token...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="reset-password-container">
        <div className="invalid-token-state">
          <p>Validando link de redefinição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Redefinir Senha</h2>
        <p className="email-display">Para: {formData.email}</p>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="password">Nova Senha</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="8"
              autoComplete="new-password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;