import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
// Não há 'import logo...' aqui

const LandingPage = () => {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="landing-nav-container">
                    {/* ✅ CORREÇÃO: O 'src' agora é um texto com o caminho direto */}
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="landing-logo" />
                    <nav className="landing-nav">
                        <a href="#features">Funcionalidades</a>
                        <a href="#pricing">Preço</a>
                        <Link to="/login" className="nav-login-btn">Entrar</Link>
                    </nav>
                </div>
            </header>

            <main>
                <section className="hero-section">
                    <div className="hero-content">
                        <h1>Organize sua Jornada Bariátrica com Confiança e Simplicidade.</h1>
                        <p className="hero-subtitle">
                            Do pré ao pós-operatório, o BariPlus é o seu assistente pessoal para controlar checklist, peso, consultas, medicação e muito mais.
                        </p>
                        <Link to="/login" className="hero-cta-btn">Comece a sua jornada agora</Link>
                    </div>
                </section>

                <section id="features" className="features-section">
                    <h2>Tudo o que você precisa em um só lugar</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>Checklists Completos</h3>
                            <p>Controle todas as suas tarefas pré e pós-operatórias para não se esquecer de nada.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Acompanhe seu Progresso</h3>
                            <p>Registre seu peso, medidas e veja sua evolução em gráficos e com fotos.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Consultas e Exames</h3>
                            <p>Organize todos os seus compromissos médicos em um calendário visual e intuitivo.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Controle de Medicação</h3>
                            <p>Crie sua lista de vitaminas e medicamentos e marque as tomas diárias para não falhar.</p>
                        </div>
                    </div>
                </section>

                <section id="pricing" className="pricing-section">
                     <div className="pricing-card-public">
                        <h2>Acesso Vitalício</h2>
                        <p className="pricing-description">
                            Um único pagamento para ter acesso a todas as funcionalidades atuais e futuras. Sem mensalidades, sem surpresas.
                        </p>
                        <div className="price-tag-public">
                            <span className="price-amount-public">R$ 49,90</span>
                            <span className="price-term-public">Pagamento Único</span>
                        </div>
                        <Link to="/login" className="hero-cta-btn">Quero acesso vitalício</Link>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} BariPlus. Todos os direitos reservados.</p>
                <Link to="/termos">Termos de Serviço</Link>
            </footer>
        </div>
    );
};

export default LandingPage;