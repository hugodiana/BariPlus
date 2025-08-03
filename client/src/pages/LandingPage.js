import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const [searchParams] = useSearchParams();
    const afiliadoCode = searchParams.get('afiliado');

    // Monta o link para a página de login/cadastro, preservando o código do afiliado
    const getLoginLink = () => {
        const baseUrl = '/login';
        return afiliadoCode ? `${baseUrl}?afiliado=${afiliadoCode}` : baseUrl;
    };
    
    return (
        <div className="landing-container">
            {/* --- SEÇÃO 1: HERÓI --- */}
            <header className="hero-section">
                <img src="/bariplus_logo.png" alt="BariPlus Logo" className="hero-logo" />
                <h1 className="hero-title">A sua jornada bariátrica, organizada e no seu bolso.</h1>
                <p className="hero-subtitle">Acompanhe seu progresso, exames, consultas e diário alimentar em um só lugar.</p>
                <Link to={getLoginLink()} className="hero-cta-button">
                    Começar Agora
                </Link>
            </header>

            <main>
                {/* --- SEÇÃO 2: FUNCIONALIDADES --- */}
                <section className="features-section">
                    <h2>Tudo o que você precisa para uma jornada de sucesso</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <span className="feature-icon">📊</span>
                            <h3>Acompanhe seu Progresso</h3>
                            <p>Registe seu peso e mais de 10 medidas corporais. Veja sua evolução em gráficos detalhados.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon">⚕️</span>
                            <h3>Controle de Exames</h3>
                            <p>Guarde os resultados dos seus exames laboratoriais e visualize o histórico para partilhar com a sua equipa médica.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon">🗓️</span>
                            <h3>Agenda de Consultas</h3>
                            <p>Nunca mais se esqueça de uma consulta. Organize todos os seus compromissos médicos num calendário inteligente.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon">🥗</span>
                            <h3>Diário Alimentar</h3>
                            <p>Registe as suas refeições e monitore a sua ingestão de calorias e macronutrientes com a nossa base de dados de alimentos.</p>
                        </div>
                    </div>
                </section>

                {/* --- SEÇÃO 3: PREÇO --- */}
                <section className="pricing-section-lp">
                    <h2>Um investimento único na sua saúde</h2>
                    <div className="pricing-card-lp">
                        <h3>Acesso Vitalício</h3>
                        <p className="price-lp">R$ 109,99</p>
                        <p className="price-desc-lp">Pagamento único. Acesso para sempre a todas as funcionalidades atuais e futuras.</p>
                        <Link to={getLoginLink()} className="pricing-cta-button-lp">
                            Garantir o Meu Acesso
                        </Link>
                    </div>
                </section>

                {/* --- SEÇÃO 4: FAQ (Perguntas Frequentes) --- */}
                <section className="faq-section">
                    <h2>Perguntas Frequentes</h2>
                    <div className="faq-item">
                        <h4>O pagamento é seguro?</h4>
                        <p>Sim! Todo o processamento é feito pela Kiwify, uma das maiores e mais seguras plataformas de pagamento do Brasil.</p>
                    </div>
                    <div className="faq-item">
                        <h4>É uma assinatura ou pagamento único?</h4>
                        <p>É um pagamento único de R$ 109,99 que lhe dá acesso vitalício a todas as funcionalidades do BariPlus, incluindo futuras atualizações.</p>
                    </div>
                    <div className="faq-item">
                        <h4>Como funciona o programa de afiliados?</h4>
                        <p>Após se tornar cliente, você pode se inscrever no nosso programa de afiliados através da página "Ganhe Renda Extra" dentro do app e receber um link para partilhar. Você ganha 30% de comissão por cada venda!</p>
                    </div>
                </section>
            </main>

            {/* --- SEÇÃO 5: RODAPÉ --- */}
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