// client/src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import './LoginPage.css'; // ✅ REUTILIZANDO O CSS DA PÁGINA DE LOGIN

// Reutilizando os mesmos depoimentos da página de login para consistência
const testimonials = [
    {
        quote: "O BariPlus foi um divisor de águas no meu pós-operatório. Ter tudo organizado num só lugar tirou um peso enorme das minhas costas.",
        author: "Juliana S.",
        details: "6 meses de pós-operatório",
        avatar: "https://i.imgur.com/L4DD8sT.png"
    },
    {
        quote: "Finalmente uma ferramenta que entende as nossas necessidades. Os gráficos de progresso são a minha maior motivação diária!",
        author: "Marcos R.",
        details: "1 ano de pós-operatório",
        avatar: "https://i.imgur.com/n5a2j42.png"
    },
    {
        quote: "Indispensável! Uso todos os dias para controlar as minhas vitaminas e o consumo de proteína. Recomendo a todos.",
        author: "Carla M.",
        details: "3 meses de pós-operatório",
        avatar: "https://i.imgur.com/7D7I6d9.png"
    }
];

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        nome: '', sobrenome: '', username: '', email: '', password: '', confirmPassword: ''
    });
    const [passwordValidations, setPasswordValidations] = useState({
        length: false, uppercase: false, number: false, specialChar: false,
    });
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
        setPasswordValidations(validations);
        return Object.values(validations).every(Boolean);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'password') {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }
        if (!validatePassword(form.password)) {
            return toast.error("A sua senha não cumpre os requisitos de segurança.");
        }
        setIsLoading(true);
        try {
            const data = await fetchApi('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            toast.success(data.message || "Cadastro realizado com sucesso! Verifique seu e-mail.");
            navigate('/login');
        } catch (error) {
            toast.error(error.message || "Erro ao realizar cadastro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-section">
                <div className="auth-form-wrapper">
                    <div className="auth-form-header">
                        <Link to="/landing">
                            <img src="/bariplus_logo.png" alt="BariPlus Logo" className="auth-logo" />
                        </Link>
                        <h2>Crie a sua conta</h2>
                        <p>Comece hoje a sua jornada de transformação.</p>
                    </div>
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleInputChange} required />
                            <input type="text" name="sobrenome" placeholder="Sobrenome" value={form.sobrenome} onChange={handleInputChange} required />
                        </div>
                        <input type="text" name="username" placeholder="Nome de usuário (para o @)" value={form.username} onChange={handleInputChange} required />
                        <input type="email" name="email" placeholder="Seu melhor e-mail" value={form.email} onChange={handleInputChange} required />
                        <input type="password" name="password" placeholder="Crie uma senha forte" value={form.password} onChange={handleInputChange} required />
                        <PasswordStrengthIndicator validations={passwordValidations} />
                        <input type="password" name="confirmPassword" placeholder="Confirme a sua senha" value={form.confirmPassword} onChange={handleInputChange} required />

                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? 'A criar conta...' : 'Criar Conta'}
                        </button>
                        <div className="form-footer">
                            <Link to="/login">Já tem uma conta? Faça login</Link>
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

export default RegisterPage;