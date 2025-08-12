import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './LoginPage.css'; // Reutilizando os estilos

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });
    const apiUrl = process.env.REACT_APP_API_URL;
    
    const validatePassword = (pass) => {
        const validations = {
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            specialChar: /[!@#$%^&*(),.?":{}|<>*]/.test(pass),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };
    
    const handlePasswordChange = (e) => {
        const newPass = e.target.value;
        setPassword(newPass);
        validatePassword(newPass);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }
        if (!validatePassword(password)) {
            return toast.error("A nova senha não cumpre todos os requisitos.");
        }
        
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            toast.success("Senha redefinida com sucesso! Faça o login com a sua nova senha.");
            navigate('/login');
        } catch (error) {
            toast.error(error.message || "Link inválido ou expirado.");
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <div className="auth-form-header">
                    <Link to="/landing">
                        <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                    </Link>
                    <h2>Crie a sua Nova Senha</h2>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nova Senha</label>
                        <input type="password" value={password} onChange={handlePasswordChange} required />
                        <PasswordStrengthIndicator validations={passwordValidations} />
                    </div>
                    <div className="form-group">
                        <label>Confirme a Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'A redefinir...' : 'Redefinir Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;