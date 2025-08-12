// src/pages/TermsPage.js
import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

const TermsPage = () => {
    return (
        <LegalPageLayout title="Termos de Serviço">
            <p className="last-updated">Última atualização: 12 de Agosto de 2025</p>

            <p>Bem-vindo(a) ao BariPlus! Estes termos regem o seu acesso e uso do nosso aplicativo. Ao criar uma conta, você concorda com estes termos. Por favor, leia-os com atenção.</p>

            <h2>1. Descrição do Serviço</h2>
            <p>O BariPlus ("Serviço") é uma ferramenta de software como serviço (SaaS) projetada para auxiliar pacientes de cirurgia bariátrica no acompanhamento da sua jornada, incluindo controlo de checklists, registo de progresso, agendamento de consultas, e mais.</p>

            <h2>2. Isenção de Responsabilidade Médica</h2>
            <p><strong>O BariPlus é uma ferramenta de organização e NÃO FORNECE ACONSELHAMENTO MÉDICO.</strong> As informações no aplicativo não substituem consulta, diagnóstico ou tratamento médico profissional. Consulte sempre a sua equipe de saúde qualificada.</p>

            <h2>3. A sua Conta</h2>
            <p>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorram na sua conta.</p>

            <h2>4. Pagamento e Acesso</h2>
            <p>O acesso ao BariPlus requer um **pagamento único** para uma licença de "Acesso Vitalício", processado de forma segura pelo nosso parceiro, a **Kiwify**. Nós não armazenamos os detalhes do seu cartão de crédito.</p>

            <h2>5. Conteúdo do Utilizador</h2>
            <p>Você retém todos os direitos sobre os dados que insere no aplicativo. Ao usar o serviço, você concede ao BariPlus uma licença para hospedar e exibir o seu conteúdo unicamente para lhe fornecer o serviço.</p>

            <h2>6. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso continuado do serviço após tais alterações constitui a sua aceitação dos novos Termos.</p>
    
            <h2>7. Contato</h2>
            <p>Se tiver alguma dúvida sobre estes Termos, entre em contato conosco: <strong>contato.baripluss@gmail.com</strong>.</p>
        </LegalPageLayout>
    );
};

export default TermsPage;