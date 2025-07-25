import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './StaticPage.css'; // Reutilizando o estilo das páginas estáticas

const AffiliateProgramPage = () => {
    const [pixKey, setPixKey] = useState('');
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            return toast.error("Você precisa de estar logado para se candidatar.");
        }
        try {
            const response = await fetch(`${apiUrl}/api/affiliates/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ pixKey }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message);
            setPixKey('');
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro ao enviar a sua candidatura.");
        }
    };

    return (
        <div className="static-page-container">
            <div className="static-page-card">
                <h1>Seja um Afiliado BariPlus</h1>
                <p>Junte-se ao nosso programa de parcerias e ganhe comissões a ajudar outras pessoas na sua jornada bariátrica.</p>

                <h2>Como Funciona?</h2>
                <ul>
                    <li>Receba um cupom de desconto exclusivo para partilhar.</li>
                    <li>Ganhe <strong>30% de comissão</strong> sobre cada venda realizada com o seu cupom.</li>
                    <li>Acompanhe as suas vendas num portal exclusivo.</li>
                    <li>Receba os seus pagamentos via PIX após 7 dias da venda (período de garantia).</li>
                </ul>

                <h2>Inscreva-se Agora</h2>
                <form onSubmit={handleSubmit}>
                    <p>Para se candidatar, basta estar logado na sua conta BariPlus e preencher a sua chave PIX abaixo.</p>
                    <label htmlFor="pixKey">Sua Chave PIX (E-mail, CPF ou Celular)</label>
                    <input
                        id="pixKey"
                        type="text"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="Digite a sua chave PIX para receber as comissões"
                        required
                    />
                    <button type="submit">Enviar Candidatura</button>
                </form>
            </div>
        </div>
    );
};

export default AffiliateProgramPage;