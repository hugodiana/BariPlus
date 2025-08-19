// src/pages/LandingPage.js
import React, { useEffect, useRef, memo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './LandingPage.css';

// --- COMPONENTES INTERNOS ---

const Header = ({ loginLink, ctaLink }) => (
    <header className="landing-header">
        <div className="header-content">
            <img src="/bariplus_logo.png" alt="BariPlus Logo" className="header-logo" />
            <nav className="header-nav">
                <Link to={loginLink} className="header-login-btn">Entrar</Link>
                <Link to={ctaLink} className="header-cta-btn">Começar Agora</Link>
            </nav>
        </div>
    </header>
);

const FeatureCard = memo(({ icon, title, description }) => (
    <div className="feature-card">
        <div className="feature-icon-wrapper">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
));

const TestimonialCard = memo(({ text, author, details }) => (
    <div className="testimonial-card">
        <p className="testimonial-text">"{text}"</p>
        <div className="testimonial-author">
            <strong>{author}</strong>
            <span>{details}</span>
        </div>
    </div>
));

// NOVO COMPONENTE SEMÂNTICO PARA O FAQ
const FaqItem = memo(({ question, answer }) => (
    <details className="faq-item">
        <summary className="faq-question">
            <h4>{question}</h4>
            <span className="faq-icon" aria-hidden="true"></span>
        </summary>
        <div className="faq-answer">
            <p>{answer}</p>
        </div>
    </details>
));


// --- COMPONENTE PRINCIPAL DA PÁGINA ---

const LandingPage = () => {
    const [searchParams] = useSearchParams();
    const afiliadoCode = searchParams.get('afiliado');
    const ctaLink = afiliadoCode ? `/login?afiliado=${afiliadoCode}` : '/login';

    // LÓGICA PARA ANIMAÇÃO NO SCROLL
    const sectionsRef = useRef([]);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        // Cria uma cópia da referência para usar na função de limpeza
        const currentSections = sectionsRef.current;
        currentSections.forEach(section => {
            if (section) observer.observe(section);
        });

        return () => {
            currentSections.forEach(section => {
                if (section) observer.unobserve(section);
            });
        };
    }, []);


    const features = [
        { icon: '📊', title: 'Acompanhe seu Progresso', description: 'Registre seu peso, medidas e fotos. Veja sua evolução em gráficos detalhados e motive-se a cada conquista.' },
        { icon: '⚕️', title: 'Controle Total da Saúde', description: 'Guarde resultados de exames e organize todas as suas consultas num único lugar, facilitando a comunicação com a sua equipa médica.' },
        { icon: '💊', title: 'Gestão de Medicação', description: 'Nunca mais se esqueça de uma vitamina ou medicamento. Crie lembretes diários e semanais e acompanhe o seu histórico.' },
        { icon: '🥗', title: 'Diário Alimentar Inteligente', description: 'Monitore sua ingestão de calorias e macronutrientes com a nossa vasta base de dados de alimentos (Tabela TACO).' },
    ];

    const testimonials = [
        { text: "O BariPlus foi um divisor de águas no meu pós-operatório. Ter tudo organizado num só lugar tirou um peso enorme das minhas costas.", author: "Juliana S.", details: "6 meses de pós-operatório" },
        { text: "Finalmente uma ferramenta que entende as nossas necessidades. Os gráficos de progresso são a minha maior motivação diária!", author: "Marcos R.", details: "1 ano de pós-operatório" },
        { text: "Indispensável! Uso todos os dias para controlar as minhas vitaminas e o consumo de proteína. Recomendo a todos que vão fazer a cirurgia.", author: "Carla M.", details: "3 meses de pós-operatório" },
    ];
    
    const faqs = [
        { question: 'O pagamento é seguro?', answer: 'Sim! Todo o processamento é feito pela Kiwify, uma das maiores e mais seguras plataformas de pagamento do Brasil.' },
        { question: 'É uma assinatura ou pagamento único?', answer: 'É um pagamento único de R$ 109,99 que lhe dá acesso vitalício a todas as funcionalidades do BariPlus, incluindo futuras atualizações.' },
        { question: 'Como funciona o programa de afiliados?', answer: 'Após se tornar cliente, você pode se inscrever no nosso programa de afiliados dentro do app e ganhar 30% de comissão por cada venda!' },
    ];

    return (
        <div className="landing-container">
            <Header loginLink={ctaLink} ctaLink={ctaLink} />

            <section className="hero-section">
                <img src="/bariplus_logo.png" alt="BariPlus Logo" className="hero-logo" loading="lazy" />
                <h1 className="hero-title">A sua jornada bariátrica, organizada e no seu bolso.</h1>
                <p className="hero-subtitle">Acompanhe seu progresso, exames, consultas e diário alimentar de forma simples e intuitiva.</p>
                <Link to={ctaLink} className="hero-cta-button">Começar a Minha Jornada</Link>
                {afiliadoCode && <p className="afiliado-info">Você foi indicado por: <strong>{afiliadoCode}</strong></p>}
            </section>

            <main>
                <section ref={el => sectionsRef.current[0] = el} className="features-section animated-section">
                    <h2>Tudo o que você precisa para uma jornada de sucesso</h2>
                    <div className="features-grid">{features.map((f, i) => <FeatureCard key={i} {...f} />)}</div>
                </section>

                <section ref={el => sectionsRef.current[1] = el} className="testimonials-section animated-section">
                    <h2>O que os nossos utilizadores dizem</h2>
                    <div className="testimonials-grid">{testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}</div>
                </section>

                <section ref={el => sectionsRef.current[2] = el} className="pricing-section-lp animated-section">
                    <h2>Um investimento único na sua saúde</h2>
                    <div className="pricing-card-lp">
                        <h3>Acesso Vitalício</h3>
                        <p className="price-lp">R$ 109,99</p>
                        <p className="price-desc-lp">Pagamento único. Acesso para sempre a todas as funcionalidades atuais e futuras.</p>
                        <Link to={ctaLink} className="hero-cta-button">Garantir o Meu Acesso</Link>
                    </div>
                </section>

                <section ref={el => sectionsRef.current[3] = el} className="faq-section animated-section">
                    <h2>Perguntas Frequentes</h2>
                    <div className="faq-list">
                        {faqs.map((faq, i) => <FaqItem key={i} {...faq} />)}
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>© {new Date().getFullYear()} BariPlus - Todos os direitos reservados.</p>
                <div className="footer-links">
                    <Link to="/termos">Termos de Serviço</Link>
                    <span>|</span>
                    <Link to="/privacidade">Política de Privacidade</Link>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;