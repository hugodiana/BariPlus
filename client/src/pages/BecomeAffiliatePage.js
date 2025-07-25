import React from 'react';
import { toast } from 'react-toastify';
import './StaticPage.css'; // Reutilizando o estilo
import Card from '../components/ui/Card';

const BecomeAffiliatePage = () => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleApply = async () => {
    if (!window.confirm("Você confirma o seu interesse em se tornar um afiliado do BariPlus?")) return;

    try {
        const response = await fetch(`${apiUrl}/api/affiliate/apply`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                // ✅ Adicione esta linha de 'Content-Type'
                'Content-Type': 'application/json'
            },
            // ✅ Adicione esta linha com um corpo vazio
            body: JSON.stringify({}) 
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        toast.success(data.message);
    } catch (error) {
        toast.error(error.message || "Ocorreu um erro ao enviar a sua candidatura.");
    }
};

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Programa de Afiliados BariPlus</h1>
                <p>Ganhe uma renda extra ao indicar o aplicativo que transforma vidas.</p>
            </div>
            <Card>
                <h2>Como Funciona?</h2>
                <p>É muito simples! Após a sua candidatura ser aprovada, você receberá um cupom de desconto exclusivo para partilhar.</p>
                <ol className="steps-list">
                    <li>Você partilha o seu cupom personalizado.</li>
                    <li>O seu indicado compra o acesso vitalício com um desconto especial.</li>
                    <li>Você recebe uma comissão de **30%** sobre o valor final de cada venda.</li>
                </ol>
                <button className="cta-button" onClick={handleApply}>
                    Quero ser um Afiliado
                </button>
            </Card>
        </div>
    );
};
export default BecomeAffiliatePage;