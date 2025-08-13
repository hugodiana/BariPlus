import React from 'react';
import './GanheRendaExtraPage.css';
import Card from '../components/ui/Card';

const GanheRendaExtraPage = () => {
    const kiwifyAffiliateLink = "https://dashboard.kiwify.com/join/affiliate/CObcGj8e";

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Ganhe Renda Extra com o BariPlus</h1>
                <p>Junte-se ao nosso programa de afiliados e ganhe comissões por cada indicação!</p>
            </div>

            <div className="affiliate-page-layout">
                <div className="benefits-section">
                    <BenefitCard
                        icon="💰"
                        title="Comissão de 30%"
                        description="Você ganha 30% sobre o valor de cada venda realizada através do seu link exclusivo."
                    />
                    <BenefitCard
                        icon="💸"
                        title="Desconto para o Cliente"
                        description="O seu link oferece 30% de desconto para o novo cliente, tornando a sua divulgação muito mais atrativa."
                    />
                    <BenefitCard
                        icon="🔒"
                        title="Pagamentos Seguros"
                        description="A Kiwify processa todos os pagamentos e comissões com total segurança e transparência."
                    />
                </div>

                <Card className="how-it-works-card">
                    <h2>Como Funciona? (3 Passos Simples)</h2>
                    <div className="steps-container">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-info">
                                <h4>Inscreva-se na Kiwify</h4>
                                <p>Clique no botão abaixo e preencha o seu cadastro na plataforma de afiliados da Kiwify. É rápido e seguro.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-info">
                                <h4>Receba o seu Link</h4>
                                <p>Após a aprovação, você receberá o seu link de afiliado exclusivo para partilhar.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-info">
                                <h4>Comece a Ganhar</h4>
                                <p>Partilhe o seu link e comece a ganhar 30% de comissão por cada novo cliente que se inscrever através dele.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="cta-section">
                        <a 
                            href={kiwifyAffiliateLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="apply-button"
                        >
                            Quero Ser Afiliado Agora
                        </a>
                        <small className="kiwify-notice">Você será redirecionado para a página segura de inscrição da Kiwify.</small>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Componente auxiliar para os cards de benefício
const BenefitCard = ({ icon, title, description }) => (
    <Card className="benefit-card">
        <div className="benefit-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </Card>
);


export default GanheRendaExtraPage;