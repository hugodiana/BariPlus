// LandingPage.jsx
import React, { memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './LandingPage.css';

const FeatureCard = memo(({ icon, title, description }) => (
  <div className="feature-card">
    <span className="feature-icon">{icon}</span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
));

const FaqItem = memo(({ question, answer }) => (
  <div className="faq-item">
    <h4>{question}</h4>
    <p>{answer}</p>
  </div>
));

const LandingPage = () => {
  const [searchParams] = useSearchParams();
  const afiliadoCode = searchParams.get('afiliado');
  const loginLink = afiliadoCode ? `/login?afiliado=${afiliadoCode}` : '/login';

  const features = [
    {
      icon: '📊',
      title: 'Acompanhe seu Progresso',
      description: 'Registre seu peso e mais de 10 medidas corporais. Veja sua evolução em gráficos detalhados.',
    },
    {
      icon: '⚕️',
      title: 'Controle de Exames',
      description: 'Guarde os resultados dos seus exames laboratoriais e visualize o histórico para compartilhar com a sua equipe médica.',
    },
    {
      icon: '🗓️',
      title: 'Agenda de Consultas',
      description: 'Nunca mais se esqueça de uma consulta. Organize todos os seus compromissos médicos num calendário inteligente.',
    },
    {
      icon: '🥗',
      title: 'Diário Alimentar',
      description: 'Registre suas refeições e monitore a ingestão de calorias e macronutrientes com nossa base de dados.',
    },
  ];

  const faqs = [
    {
      question: 'O pagamento é seguro?',
      answer: 'Sim! Todo o processamento é feito pela Kiwify, uma das maiores e mais seguras plataformas de pagamento do Brasil.',
    },
    {
      question: 'É uma assinatura ou pagamento único?',
      answer: 'É um pagamento único de R$ 109,99 que lhe dá acesso vitalício a todas as funcionalidades do BariPlus, incluindo futuras atualizações.',
    },
    {
      question: 'Como funciona o programa de afiliados?',
      answer: 'Após se tornar cliente, você pode se inscrever no nosso programa de afiliados dentro do app e ganhar 30% de comissão por cada venda!',
    },
  ];

  return (
    <div className="landing-container">
      <header className="hero-section">
        <img src="/bariplus_logo.webp" alt="BariPlus Logo" className="hero-logo" />
        <h1 className="hero-title">A sua jornada bariátrica, organizada e no seu bolso.</h1>
        <p className="hero-subtitle">Acompanhe seu progresso, exames, consultas e diário alimentar em um só lugar.</p>
        <Link to={loginLink} className="hero-cta-button">Começar Agora</Link>
        {afiliadoCode && (
          <p className="afiliado-info">Você foi indicado por: <strong>{afiliadoCode}</strong></p>
        )}
      </header>

      <main>
        <section className="features-section" aria-label="Funcionalidades">
          <h2>Tudo o que você precisa para uma jornada de sucesso</h2>
          <div className="features-grid">
            {features.map((f, index) => (
              <FeatureCard key={index} {...f} />
            ))}
          </div>
        </section>

        <section className="pricing-section-lp" aria-label="Preço">
          <h2>Um investimento único na sua saúde</h2>
          <div className="pricing-card-lp">
            <h3>Acesso Vitalício</h3>
            <p className="price-lp">R$ 109,99</p>
            <p className="price-desc-lp">Pagamento único. Acesso para sempre a todas as funcionalidades atuais e futuras.</p>
            <Link to={loginLink} className="pricing-cta-button-lp">Garantir o Meu Acesso</Link>
          </div>
        </section>

        <section className="faq-section" aria-label="Perguntas Frequentes">
          <h2>Perguntas Frequentes</h2>
          {faqs.map((faq, index) => (
            <FaqItem key={index} {...faq} />
          ))}
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2025 BariPlus - Todos os direitos reservados.</p>
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
