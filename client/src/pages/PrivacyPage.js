import React from 'react';
import './LegalPage.css'; // Usando o mesmo estilo

const PrivacyPage = () => {
    return (
        <div className="legal-container">
            <h1>Política de Privacidade do BariPlus</h1>
            <p><strong>Última atualização:</strong> 18 de julho de 2025</p>

            <h2>1. Coleta de Informações</h2>
            <p>
                Coletamos informações que você nos fornece diretamente, como nome, e-mail, e dados de saúde que você registra no aplicativo (peso, medidas, etc.).
            </p>
            
            <h2>2. Uso das Informações</h2>
            <p>
                Usamos as suas informações para fornecer, manter e melhorar o Serviço. Não compartilharemos suas informações pessoais com terceiros, exceto conforme necessário para fornecer o serviço (ex: processadores de pagamento como o Stripe).
            </p>

            {/* AVISO: Adicione aqui a sua política completa. */}
            <p><strong>[Este é um texto de exemplo. Consulte um profissional para criar sua política de privacidade completa, em conformidade com a LGPD.]</strong></p>
        </div>
    );
};

export default PrivacyPage;