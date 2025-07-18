import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPage.css'; // Vamos criar um estilo genérico

const TermsPage = () => {
    return (
        <div className="static-page-card">
            <h1>Termos de Serviço do BariPlus</h1>
            <p>Última atualização: 18 de Julho de 2025</p>

            <p>Bem-vindo(a) ao BariPlus! Estes termos regem o seu acesso e uso do nosso aplicativo e serviços. Ao criar uma conta ou usar o BariPlus, você concorda com estes termos na sua totalidade. Por favor, leia-os com atenção.</p>

            <h2>1. Descrição do Serviço</h2>
            <p>O BariPlus ("Serviço") é um aplicativo de software como serviço (SaaS) projetado para auxiliar pacientes de cirurgia bariátrica no acompanhamento da sua jornada pré e pós-operatória. As funcionalidades incluem, mas não se limitam a, controlo de checklists, registo de progresso (peso, medidas e fotos), agendamento de consultas, controlo de medicação e um diário alimentar.</p>

            <h2>2. Isenção de Responsabilidade Médica</h2>
            <p><strong>O BariPlus é uma ferramenta de organização e acompanhamento, e NÃO FORNECE ACONSELHAMENTO MÉDICO.</strong> As informações contidas no aplicativo, incluindo as fornecidas pela busca de alimentos, não devem ser consideradas como um substituto para consulta, diagnóstico ou tratamento médico profissional. Consulte sempre o seu médico ou outro profissional de saúde qualificado para tirar qualquer dúvida que possa ter sobre uma condição médica.</p>

            <h2>3. A sua Conta</h2>
            <p>Para aceder ao serviço, você deve registar-se e criar uma conta. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorram sob a sua conta. Você concorda em notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta.</p>

            <h2>4. Pagamento e Acesso</h2>
            <p>O acesso às funcionalidades do BariPlus requer um **pagamento único** para uma licença de "Acesso Vitalício". Todos os pagamentos são processados de forma segura através do nosso parceiro de pagamentos, o **Stripe**. Nós não armazenamos os detalhes do seu cartão de crédito. Uma vez que o pagamento é confirmado, o acesso é liberado. Políticas de reembolso, se aplicáveis, serão tratadas caso a caso através do nosso suporte.</p>

            <h2>5. Conteúdo do Usuário</h2>
            <p>Você retém todos os direitos sobre os dados que insere no aplicativo, incluindo textos, números e as fotos de progresso que você envia ("Conteúdo do Usuário"). Ao usar o serviço, você concede ao BariPlus uma licença para hospedar, armazenar e exibir o seu Conteúdo do Usuário unicamente com o propósito de operar e fornecer o serviço para si.</p>

            <h2>6. Notificações Push</h2>
            <p>Se você optar por ativar as notificações push, concorda em receber lembretes e alertas relacionados ao seu uso do aplicativo, como lembretes de consultas e de toma de medicação. Você pode gerir estas permissões a qualquer momento nas configurações do seu dispositivo ou navegador.</p>

            <h2>7. Cancelamento e Encerramento</h2>
            <p>Nós podemos suspender ou encerrar o seu acesso ao serviço a qualquer momento, por qualquer motivo, incluindo a violação destes Termos. Você pode parar de usar o serviço a qualquer momento.</p>

            <h2>8. Limitação de Responsabilidade</h2>
            <p>O serviço é fornecido "como está". Em nenhuma circunstância o BariPlus será responsável por quaisquer danos diretos ou indiretos resultantes do uso ou da incapacidade de usar o serviço.</p>

            <h2>9. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre quaisquer alterações significativas. O uso continuado do serviço após tais alterações constitui a sua aceitação dos novos Termos.</p>
    
            <h2>10. Contato</h2>
            <p>Se tiver alguma dúvida sobre estes Termos, por favor, entre em contato conosco através do e-mail: <strong>[seu-email-de-suporte@exemplo.com]</strong>.</p>
    
            <Link to="/landing" className="back-link">Voltar à Página Inicial</Link>
        </div>

);


export default TermsPage;