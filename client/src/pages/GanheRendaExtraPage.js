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

            <Card className="affiliate-promo-card">
                <h2>Como Funciona?</h2>
                <p className="description">
                    O nosso programa de afiliados é a sua oportunidade de obter uma renda extra divulgando uma ferramenta que realmente ajuda na jornada bariátrica. É simples, transparente e 100% gerido pela plataforma segura da Kiwify.
                </p>

                <div className="benefits-grid">
                    <div className="benefit-item">
                        <h3>Comissão de 30%</h3>
                        <p>Você ganha 30% sobre o valor de cada venda realizada através do seu link exclusivo.</p>
                    </div>
                    <div className="benefit-item">
                        <h3>Desconto para o Cliente</h3>
                        <p>O seu link oferece 30% de desconto para o novo cliente, tornando a sua divulgação muito mais atrativa.</p>
                    </div>
                    <div className="benefit-item">
                        <h3>Pagamentos Seguros</h3>
                        <p>A Kiwify processa todos os pagamentos e comissões com total segurança e transparência.</p>
                    </div>
                </div>

                <a 
                    href={kiwifyAffiliateLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="apply-button"
                >
                    Quero Ser Afiliado Agora
                </a>
                <small className="kiwify-notice">Você será redirecionado para a página de inscrição de afiliados da Kiwify.</small>
            </Card>
        </div>
    );
};

export default GanheRendaExtraPage;