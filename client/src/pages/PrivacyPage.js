// client/src/pages/PrivacyPage.js
import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

const PrivacyPage = () => {
    return (
        <LegalPageLayout title="Política de Privacidade">
            <p><strong>Última atualização:</strong> 24 de agosto de 2025</p>

            <p>
                A sua privacidade é crucial para nós. É política do BariPlus respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no nosso aplicativo.
            </p>

            <h2>1. Dados Coletados</h2>
            <p>
                Coletamos informações pessoais por meios justos e legais, com o seu conhecimento e consentimento.
            </p>
            <h3>Dados Pessoais e Dados Pessoais Sensíveis (Dados de Saúde)</h3>
            <p>
                Ao usar o nosso Serviço, você poderá nos fornecer voluntariamente informações de identificação pessoal e dados de saúde, que incluem, mas não se limitam a:
            </p>
            <ul>
                <li>Endereço de e-mail, nome e sobrenome.</li>
                <li>Dados de contato como número de telemóvel (WhatsApp).</li>
                <li>
                    <strong>Dados de Saúde:</strong> Peso, altura, data da cirurgia, medidas corporais, histórico de exames, diário alimentar, registo de medicação e hidratação. Estes dados são considerados sensíveis pela LGPD.
                </li>
            </ul>

            <h2>2. Uso dos Dados e Consentimento</h2>
            <p>
                Utilizamos os seus dados para fornecer e manter o nosso Serviço, para notificá-lo sobre alterações e para permitir que você participe de recursos interativos.
            </p>
            <p>
                <strong>Ao aceitar os termos durante o seu cadastro inicial (onboarding), você nos fornece o consentimento explícito para coletar e processar os seus dados de saúde com a finalidade exclusiva de operar as funcionalidades do aplicativo BariPlus.</strong>
            </p>

            <h2>3. Segurança dos Dados</h2>
            <p>
                A segurança dos seus dados é importante para nós. Usamos meios comercialmente aceitáveis para proteger os seus Dados Pessoais, mas lembre-se que nenhum método de transmissão pela Internet ou método de armazenamento eletrónico é 100% seguro.
            </p>
            
            {/* Adicione o resto do seu conteúdo aqui... */}
        </LegalPageLayout>
    );
};

export default PrivacyPage;