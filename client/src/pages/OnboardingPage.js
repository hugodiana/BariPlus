import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './OnboardingPage.css';

const OnboardingPage = () => {
    const [step, setStep] = useState(1);
    const [fezCirurgia, setFezCirurgia] = useState(null);
    const [temDataMarcada, setTemDataMarcada] = useState(null);
    const [dataCirurgia, setDataCirurgia] = useState('');
    const [altura, setAltura] = useState('');
    const [pesoInicial, setPesoInicial] = useState('');

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validação final antes de enviar
        if (!altura || !pesoInicial) {
            return toast.error("Por favor, preencha a sua altura e peso inicial.");
        }
        if ((fezCirurgia === 'sim' || temDataMarcada === 'sim') && !dataCirurgia) {
            return toast.error("Por favor, informe a data da sua cirurgia.");
        }

        try {
            const response = await fetch(`${apiUrl}/api/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fezCirurgia, dataCirurgia, altura, pesoInicial })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Erro ao guardar os dados.");
            
            window.location.href = '/'; // Redireciona para o painel
        } catch (error) {
            toast.error(error.message);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="form-group">
                        <label>Você já realizou a cirurgia bariátrica?</label>
                        <div className="radio-group">
                            <button type="button" className={fezCirurgia === 'sim' ? 'active' : ''} onClick={() => { setFezCirurgia('sim'); setStep(3); }}>
                                <span className="radio-icon">✅</span> Sim, já fiz
                            </button>
                            <button type="button" className={fezCirurgia === 'nao' ? 'active' : ''} onClick={() => { setFezCirurgia('nao'); setStep(2); }}>
                                <span className="radio-icon">❌</span> Ainda não
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="form-group">
                        <label>Já tem uma data marcada?</label>
                        <div className="radio-group">
                            <button type="button" className={temDataMarcada === 'sim' ? 'active' : ''} onClick={() => { setTemDataMarcada('sim'); setStep(3); }}>
                                <span className="radio-icon">🗓️</span> Sim, já tenho
                            </button>
                            <button type="button" className={temDataMarcada === 'nao' ? 'active' : ''} onClick={() => { setTemDataMarcada('nao'); setStep(3); }}>
                                <span className="radio-icon">🤔</span> Ainda não
                            </button>
                        </div>
                    </div>
                );
            case 3:
                const mostrarCampoData = fezCirurgia === 'sim' || (fezCirurgia === 'nao' && temDataMarcada === 'sim');
                return (
                    <>
                        {mostrarCampoData && (
                            <div className="form-group">
                                <label htmlFor="dataCirurgia">Qual a data da sua cirurgia?</label>
                                <input id="dataCirurgia" type="date" value={dataCirurgia} onChange={(e) => setDataCirurgia(e.target.value)} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="altura">A sua altura (em cm)</label>
                            <input id="altura" type="number" placeholder="Ex: 175" value={altura} onChange={(e) => setAltura(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="peso">O seu peso inicial (em kg)</label>
                            <input id="peso" type="number" step="0.1" placeholder="Ex: 120.5" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} required />
                        </div>
                        <button type="submit" className="submit-btn">Salvar e Começar a Usar!</button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            <form className="onboarding-form" onSubmit={handleSubmit}>
                <div className="form-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" />
                    <h1>Quase lá!</h1>
                    <p>Para personalizar a sua experiência, precisamos de apenas mais alguns detalhes.</p>
                </div>
                {renderStep()}
            </form>
        </div>
    );
};

export default OnboardingPage;