import React, { useState } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import '../App.css';

const AdminLoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email ou username é obrigatório';
    }
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Para cookies de sessão, se aplicável
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha no login. Verifique suas credenciais.');
      }

      if (!data.token) {
        throw new Error('Token não recebido na resposta');
      }

      toast.success('Login realizado com sucesso!');
      onLoginSuccess(data.token);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Ocorreu um erro durante o login');
      setErrors(prev => ({
        ...prev,
        form: error.message
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-app">
      <div className="admin-login-container">
        <div className="login-box">
          <img 
            src="/bariplus_logo.png" 
            alt="BariPlus Logo" 
            className="login-logo-admin" 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/default-logo.png';
            }}
          />
          <h2>Painel de Administração</h2>
          
          {errors.form && (
            <div className="error-message">{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="identifier">Email ou Username</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                className={errors.identifier ? 'input-error' : ''}
                disabled={isSubmitting}
              />
              {errors.identifier && (
                <span className="error-text">{errors.identifier}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className={errors.password ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-btn-admin" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

AdminLoginPage.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired
};

export default AdminLoginPage;