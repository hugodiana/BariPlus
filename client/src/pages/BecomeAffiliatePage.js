import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './StaticPage.css'; // Reutilizando o estilo
import Card from '../components/ui/Card';

const BecomeAffiliatePage = () => {
    const [whatsapp, setWhatsapp] = useState('');
    const [pixKeyType, setPixKeyType] = useState('Celular');
    const [pixKey, setPixKey] = useState('');
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleApply = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/affiliate/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ whatsapp, pixKeyType, pixKey })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message);
            // Limpa o formulário após o sucesso
            setWhatsapp('');
            setPixKeyType('Celular');
            setPixKey('');
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro ao enviar a sua candidatura.");
        } finally {
            setLoading(false);
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
                <p>É muito simples! Ao se tornar um afiliado, você receberá um cupom de desconto exclusivo de **30%** para compartilhar. Por cada venda realizada com o seu cupom, você recebe uma comissão de **30%** sobre o valor final pago pelo cliente.</p>
                
                <h3 className="form-title">Formulário de Inscrição</h3>
                <p>Preencha os dados abaixo para se candidatar. As informações de pagamento são necessárias para que possamos enviar as suas comissões.</p>
                
                <form onSubmit={handleApply} className="affiliate-form">
                    <div className="form-group">
                        <label htmlFor="whatsapp">Seu WhatsApp (com DDD)</label>
                        <input
                            id="whatsapp"
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="(11) 91234-5678"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pixKeyType">Tipo de Chave Pix</label>
                        <select
                            id="pixKeyType"
                            value={pixKeyType}
                            onChange={(e) => setPixKeyType(e.target.value)}
                            required
                        >
                            <option>Celular</option>
                            <option>E-mail</option>
                            <option>CPF/CNPJ</option>
                            <option>Aleatória</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="pixKey">Sua Chave Pix</label>
                        <input
                            id="pixKey"
                            type="text"
                            value={pixKey}
                            onChange={(e) => setPixKey(e.target.value)}
                            placeholder="Chave para receber as comissões"
                            required
                        />
                    </div>
                    <button type="submit" className="cta-button" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Candidatura'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default BecomeAffiliatePage;