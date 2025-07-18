import React from 'react';
import './LegalPage.css'; // Usaremos um estilo compartilhado

const TermsPage = () => {
    return (
        <div className="legal-container">
            <h1>Termos de Serviço do BariPlus</h1>
            <p><strong>Última atualização:</strong> 18 de julho de 2025</p>

            <h2>1. Aceitação dos Termos</h2>
            <p>
                Ao se cadastrar e usar o aplicativo BariPlus ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Serviço.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
                O BariPlus é uma ferramenta para auxiliar no acompanhamento da jornada de pacientes bariátricos. As informações fornecidas não substituem o aconselhamento médico profissional. Consulte sempre a sua equipe de saúde.
            </p>

            <h2>3. Uso da Conta</h2>
            <p>
                Você é responsável por manter a confidencialidade da sua senha e conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado da sua conta.
            </p>

            {/* AVISO: Adicione aqui os seus termos completos. */}
            <p><strong>[Este é um texto de exemplo. Consulte um profissional para criar seus termos de serviço completos.]</strong></p>
        </div>
    );
};

export default TermsPage;