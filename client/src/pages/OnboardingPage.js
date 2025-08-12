import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './OnboardingPage.css';

const OnboardingPage = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Unificando o estado do formulário
    const [formState, setFormState] = useState({
        fezCirurgia: null,
        temDataMarcada: null,
        dataCirurgia: '',
        altura: '',
        pesoInicial: '',
        metaPeso: '' // ✅ NOVO CAMPO
    });

    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionClick = (field, value, nextStep) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        setStep(nextStep);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Validações
        if (!formState.altura || !formState.pesoInicial || !formState.metaPeso) {
            toast.error("Por favor, preencha a sua altura, peso inicial e a sua meta.");
            setIsLoading(false);
            return;
        }
        
        try {
            const response = await fetch(`${apiUrl}/api/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formState)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Erro ao guardar os dados.");
            }
            
            // Recarrega a página para que o App.js possa redirecionar para a dashboard
            window.location.href = '/'; 
        } catch (error) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="form-group">
                        <label>Você já realizou a cirurgia bariátrica?</label>
                        <div className="radio-group">
                            <button type="button" className={formState.fezCirurgia === 'sim' ? 'active' : ''} onClick={() => handleOptionClick('fezCirurgia', 'sim', 3)}>Sim, já fiz</button>
                            <button type="button" className={formState.fezCirurgia === 'nao' ? 'active' : ''} onClick={() => handleOptionClick('fezCirurgia', 'nao', 2)}>Ainda não</button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="form-group">
                        <label>Já tem uma data marcada?</label>
                        <div className="radio-group">
                            <button type="button" className={formState.temDataMarcada === 'sim' ? 'active' : ''} onClick={() => handleOptionClick('temDataMarcada', 'sim', 3)}>Sim, já tenho</button>
                            <button type="button" className={formState.temDataMarcada === 'nao' ? 'active' : ''} onClick={() => handleOptionClick('temDataMarcada', 'nao', 3)}>Ainda não</button>
                        </div>
                    </div>
                );
            case 3:
                const mostrarCampoData = formState.fezCirurgia === 'sim' || formState.temDataMarcada === 'sim';
                return (
                    <>
                        {mostrarCampoData && (
                            <div className="form-group">
                                <label htmlFor="dataCirurgia">Qual a data da sua cirurgia?</label>
                                <input id="dataCirurgia" name="dataCirurgia" type="date" value={formState.dataCirurgia} onChange={handleInputChange} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="altura">A sua altura (em cm)</label>
                            <input id="altura" name="altura" type="number" placeholder="Ex: 175" value={formState.altura} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pesoInicial">O seu peso inicial (em kg)</label>
                            <input id="pesoInicial" name="pesoInicial" type="number" step="0.1" placeholder="Ex: 120.5" value={formState.pesoInicial} onChange={handleInputChange} required />
                        </div>
                        {/* ✅ NOVO: Botão para avançar para o próximo passo */}
                        <button type="button" className="submit-btn" onClick={() => setStep(4)}>Próximo Passo</button>
                    </>
                );
            case 4:
                return (
                    <>
                        <div className="form-group">
                            <label htmlFor="metaPeso">Qual a sua meta de peso (em kg)?</label>
                            <p className="label-description">Este é o peso que você almeja alcançar. Você poderá ajustar este valor mais tarde no seu perfil.</p>
                            <input id="metaPeso" name="metaPeso" type="number" step="0.1" placeholder="Ex: 75.5" value={formState.metaPeso} onChange={handleInputChange} required />
                        </div>
                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'A salvar...' : 'Salvar e Começar a Usar!'}
                        </button>
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