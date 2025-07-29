import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'; // Reutilizando nosso componente

const ResetPasswordPage = () => {
    // useParams pega o token diretamente do URL (ex: /reset-password/TOKEN123)
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado para a validação da senha forte
    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
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
            navigate('/login'); // Redireciona em caso de erro também
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-wrapper">
                <div className="login-form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="login-logo" />
                    <h2>Crie a sua Nova Senha</h2>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <label>Nova Senha</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={handlePasswordChange} 
                        placeholder="Digite sua nova senha" 
                        required 
                    />
                    <PasswordStrengthIndicator validations={passwordValidations} />
                    
                    <label>Confirme a Nova Senha</label>
                    <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Confirme sua nova senha" 
                        required 
                    />
                    
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'A redefinir...' : 'Redefinir Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;