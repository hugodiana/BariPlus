// client/src/pages/TermsPage.js
import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout';

const TermsPage = () => {
    return (
        <LegalPageLayout title="Termos de Serviço">
            <p><strong>Última atualização:</strong> 24 de agosto de 2025</p>

            <p>
                Bem-vindo ao BariPlus! Estes termos e condições descrevem as regras e regulamentos para o uso do aplicativo BariPlus.
                Ao aceder a este aplicativo, assumimos que você aceita estes termos e condições. Não continue a usar o BariPlus se não concordar com todos os termos e condições declarados nesta página.
            </p>

            <h2>1. Definições</h2>
            <p>
                A terminologia seguinte aplica-se a estes Termos e Condições, Declaração de Privacidade e Aviso de Isenção de Responsabilidade e todos os Acordos: "Cliente", "Você" e "Seu" referem-se a você, a pessoa que acede a este aplicativo e que está em conformidade com os termos e condições da Empresa.
            </p>

            <h2>2. Uso de Licença</h2>
            <p>
                É concedida permissão para descarregar temporariamente uma cópia dos materiais (informação ou software) no aplicativo BariPlus, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:
            </p>
            <ul>
                <li>Modificar ou copiar os materiais;</li>
                <li>Usar os materiais para qualquer finalidade comercial ou para qualquer exibição pública (comercial ou não comercial);</li>
                <li>Tentar descompilar ou fazer engenharia reversa de qualquer software contido no aplicativo BariPlus;</li>
                <li>Remover quaisquer direitos autorais ou outras notações de propriedade dos materiais.</li>
            </ul>

            <h2>3. Isenção de Responsabilidade</h2>
            <p>
                O BariPlus não substitui o aconselhamento médico profissional, diagnóstico ou tratamento. Procure sempre o conselho do seu médico ou de outro profissional de saúde qualificado com quaisquer perguntas que possa ter sobre uma condição médica.
            </p>

            {/* Adicione o resto do seu conteúdo aqui... */}
        </LegalPageLayout>
    );
};

export default TermsPage;