import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPage.css'; // Vamos criar um estilo genérico

const TermsPage = () => {
    return (
        <div className="static-page-container">
            <div className="static-page-card">
                <h1>Termos de Serviço</h1>
                <p>Última atualização: 18 de Julho de 2025</p>

                <p>Bem-vindo(a) ao BariPlus! Ao utilizar nosso aplicativo, você concorda com estes termos. Por favor, leia-os com atenção.</p>

                <h2>1. Uso da Conta</h2>
                <p>Você é responsável por manter a confidencialidade da sua conta e senha e por restringir o acesso ao seu dispositivo. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram sob sua conta ou senha.</p>

                <h2>2. Pagamentos</h2>
                <p>O acesso às funcionalidades do BariPlus requer um pagamento único. Todos os pagamentos são processados através do nosso parceiro de pagamentos, Stripe, e estão sujeitos aos seus termos de serviço.</p>
                
                {/* Adicione aqui o resto do seu texto de termos de serviço */}

                <Link to="/landing" className="back-link">Voltar para a Página Inicial</Link>
            </div>
        </div>
    );
};

export default TermsPage;