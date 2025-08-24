// client/src/pages/ForgotPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import './LoginPage.css'; // Reutilizando o mesmo estilo

// Reutilizando os mesmos depoimentos para consistência
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

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Efeito para o carrossel de depoimentos
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await fetchApi('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            toast.success(data.message);
            setMessageSent(true);
        } catch (error) {
            toast.error(error.message || 'Ocorreu um erro ao enviar o e-mail.');
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
                        <h2>Recuperar Senha</h2>
                    </div>
                    {messageSent ? (
                        <div className="form-success-message">
                            <h3>Verifique o seu e-mail</h3>
                            <p>
                                Se existir uma conta associada a <strong>{email}</strong>, você receberá um link
                                para redefinir a sua senha. Por favor, verifique também a sua pasta de spam.
                            </p>
                            <div className="form-footer">
                                <Link to="/login">Voltar para o Login</Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="form-description">
                                Não se preocupe! Insira o seu e-mail abaixo e nós enviaremos um link para você criar uma nova senha.
                            </p>
                            <form className="auth-form" onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Seu e-mail de cadastro"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="submit-button" disabled={isLoading}>
                                    {isLoading ? 'A enviar...' : 'Enviar Link de Recuperação'}
                                </button>
                                <div className="form-footer">
                                    <Link to="/login">Lembrou-se da senha? Faça login</Link>
                                </div>
                            </form>
                        </>
                    )}
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

export default ForgotPasswordPage;