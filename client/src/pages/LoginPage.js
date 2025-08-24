// client/src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { fetchApi, setAuthToken } from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import './LoginPage.css';

const testimonials = [
    { quote: "O BariPlus foi um divisor de águas no meu pós-operatório...", author: "Juliana S.", details: "6 meses de pós-operatório", avatar: "https://i.imgur.com/L4DD8sT.png" },
    { quote: "Finalmente uma ferramenta que entende as nossas necessidades...", author: "Marcos R.", details: "1 ano de pós-operatório", avatar: "https://i.imgur.com/n5a2j42.png" },
    { quote: "Indispensável! Uso todos os dias para controlar as minhas vitaminas...", author: "Carla M.", details: "3 meses de pós-operatório", avatar: "https://i.imgur.com/7D7I6d9.png" }
];

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // ✅ CORREÇÃO: A rota correta agora é /api/auth/login
            const data = await fetchApi('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setAuthToken(data.token);
            login(data.user, data.token);
            toast.success("Login bem-sucedido! A redirecionar...");
        } catch (error) {
            toast.error(error.message || "Credenciais inválidas.");
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = () => {
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
    };

    return (
        <div className="login-page-container">
            <div className="login-form-section">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <Link to="/landing">
                            <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                        </Link>
                        <h2>Bem-vindo(a) de volta!</h2>
                        <p>A sua jornada de sucesso continua aqui.</p>
                    </div>
                    <button onClick={handleGoogleLogin} className="social-login-btn google-btn">
                        <FontAwesomeIcon icon={faGoogle} /> Entrar com Google
                    </button>
                    <div className="divider"><span>ou entre com seu e-mail</span></div>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input type="text" name="identifier" placeholder="Email ou Nome de Usuário" value={form.identifier} onChange={handleInputChange} required />
                        <input type="password" name="password" placeholder="Senha" value={form.password} onChange={handleInputChange} required />
                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? 'A entrar...' : 'Entrar'}
                        </button>
                        <div className="form-footer">
                            <Link to="/register">Não tem uma conta? **Entre agora para o BariPlus**</Link>
                            <Link to="/forgot-password">Esqueceu sua senha?</Link>
                        </div>
                    </form>
                </div>
            </div>
            <div className="login-testimonial-section">
                <div className="testimonial-content">
                    <h2 className="testimonial-title">Junte-se a milhares de pacientes na sua jornada de transformação.</h2>
                    <div className="testimonial-card">
                        <p className="testimonial-quote">"{testimonials[currentTestimonial].quote}"</p>
                        <div className="testimonial-author">
                            <img src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].author} className="author-avatar" />
                            <div className="author-info">
                                <strong>{testimonials[currentTestimonial].author}</strong>
                                <span>{testimonials[currentTestimonial].details}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;