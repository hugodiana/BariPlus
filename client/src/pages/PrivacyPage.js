import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPage.css'; // O nome do CSS é StaticPage.css

const PrivacyPage = () => {
    return (
        // ✅ CORREÇÃO: Adicionado o 'container' principal que estava em falta
        <div className="static-page-container">
            <div className="static-page-card">
                <h1>Política de Privacidade do BariPlus</h1>
                <p>Última atualização: 18 de Julho de 2025</p>

                <p>A sua privacidade é uma prioridade para o BariPlus. Esta política explica quais informações coletamos, como as usamos e as medidas que tomamos para as proteger.</p>

                <h2>1. Informações que Coletamos</h2>
                <ul>
                    <li><strong>Informações de Cadastro:</strong> Nome, sobrenome, nome de usuário, e-mail e senha (armazenada de forma criptografada).</li>
                    <li><strong>Informações de Perfil e Saúde:</strong> Dados fornecidos no onboarding, como status da cirurgia, data da cirurgia, altura, e todos os registos de progresso, incluindo peso, medidas corporais e fotos.</li>
                    <li><strong>Dados de Uso:</strong> Listas de tarefas, consultas agendadas, lista de medicamentos, histórico de tomas e registos do diário alimentar.</li>
                    <li><strong>Informações de Pagamento:</strong> Processamos os pagamentos através do Stripe. Não armazenamos os detalhes do seu cartão de crédito. Guardamos apenas um identificador de cliente do Stripe para gerir o seu status de pagamento.</li>
                    <li><strong>Informações de Notificação:</strong> Se você nos der permissão, guardamos o seu token de notificação push (FCM Token) para lhe enviar lembretes.</li>
                </ul>

                <h2>2. Como Usamos as Suas Informações</h2>
                <ul>
                    <li>Fornecer, operar e manter o serviço BariPlus.</li>
                    <li>Personalizar a sua experiência (ex: mostrar a contagem de dias no painel).</li>
                    <li>Processar as suas transações.</li>
                    <li>Enviar e-mails transacionais importantes (ex: redefinição de senha).</li>
                    <li>Enviar notificações push com lembretes, se você as tiver ativado.</li>
                    <li>Melhorar e otimizar o nosso aplicativo.</li>
                </ul>

                <h2>3. Compartilhamento de Informações</h2>
                <p>Nós **não vendemos** as suas informações pessoais. Partilhamos informações apenas com os seguintes parceiros de tecnologia que nos ajudam a operar o serviço:</p>
                <ul>
                    <li><strong>Render e Vercel:</strong> Para hospedagem da nossa infraestrutura.</li>
                    <li><strong>MongoDB Atlas:</strong> Para o armazenamento seguro da nossa base de dados.</li>
                    <li><strong>Stripe:</strong> Para o processamento seguro de pagamentos.</li>
                    <li><strong>Cloudinary:</strong> Para o armazenamento seguro das suas fotos de progresso.</li>
                    <li><strong>Brevo:</strong> Para o envio de e-mails transacionais.</li>
                    <li><strong>Google Firebase:</strong> Para o envio de notificações push.</li>
                </ul>

                <h2>4. Segurança dos Dados</h2>
                <p>Empregamos medidas de segurança padrão da indústria para proteger as suas informações.</p>

                <h2>5. Seus Direitos (LGPD)</h2>
                <p>Você tem o direito de aceder, corrigir, ou solicitar a exclusão das suas informações pessoais. Para exercer estes direitos, entre em contato conosco.</p>

                <h2>6. Contato</h2>
                <p>Se tiver alguma dúvida, entre em contato conosco: <strong>[seu-email-de-suporte@exemplo.com]</strong>.</p>

                <Link to="/landing" className="back-link">Voltar à Página Inicial</Link>
            </div>
        </div>
    );
};

export default PrivacyPage;