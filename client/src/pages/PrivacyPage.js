// src/pages/PrivacyPage.js
import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

const PrivacyPage = () => {
    return (
        <LegalPageLayout title="Política de Privacidade">
            <p className="last-updated">Última atualização: 12 de Agosto de 2025</p>

            <p>A sua privacidade é uma prioridade para o BariPlus. Esta política explica quais informações coletamos, como as usamos e as medidas que tomamos para as proteger.</p>

            <h2>1. Informações que Coletamos</h2>
            <ul>
                <li><strong>Informações de Cadastro:</strong> Nome, e-mail e senha (criptografada).</li>
                <li><strong>Informações de Saúde:</strong> Dados fornecidos no onboarding, registos de peso, medidas, fotos, consultas, medicamentos e diário alimentar.</li>
                <li><strong>Informações de Pagamento:</strong> O pagamento é processado pela Kiwify. Não armazenamos os detalhes do seu cartão de crédito.</li>
                <li><strong>Informações Técnicas:</strong> Se autorizado, guardamos o seu token de notificação (FCM Token) para lhe enviar lembretes.</li>
            </ul>

            <h2>2. Como Usamos as Suas Informações</h2>
            <ul>
                <li>Para fornecer, operar e manter o serviço BariPlus.</li>
                <li>Para personalizar a sua experiência dentro do aplicativo.</li>
                <li>Para enviar e-mails transacionais e notificações push, se ativadas por si.</li>
            </ul>

            <h2>3. Compartilhamento de Informações</h2>
            <p>Nós **não vendemos** as suas informações pessoais. Partilhamos informações apenas com parceiros de tecnologia essenciais para operar o serviço, como serviços de hospedagem (Render, Vercel), base de dados (MongoDB Atlas) e envio de e-mails (Resend).</p>
            
            <h2>4. Segurança dos Dados</h2>
            <p>Empregamos medidas de segurança padrão da indústria para proteger as suas informações contra acesso não autorizado.</p>

            <h2>5. Seus Direitos (LGPD)</h2>
            <p>Você tem o direito de aceder, corrigir ou solicitar a exclusão das suas informações pessoais. Para exercer estes direitos, entre em contato conosco.</p>

            <h2>6. Contato</h2>
            <p>Se tiver alguma dúvida, entre em contato conosco: <strong>contato.baripluss@gmail.com</strong>.</p>
        </LegalPageLayout>
    );
};

export default PrivacyPage;