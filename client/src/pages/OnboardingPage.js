// client/src/pages/OnboardingPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ✅ CORREÇÃO: Importar o Link
import { toast } from 'react-toastify';
import { fetchApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './OnboardingPage.css';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        fezCirurgia: 'sim',
        dataCirurgia: '',
        altura: '',
        pesoInicial: '',
        metaPeso: '',
        consentimentoDados: false,
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.consentimentoDados) {
            toast.error("Você precisa de aceitar os termos de uso de dados de saúde para continuar.");
            return;
        }
        setIsLoading(true);
        try {
            const updatedUserData = await fetchApi('/api/onboarding', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            updateUser(updatedUserData); // Atualiza o contexto global
            toast.success("Tudo pronto! Bem-vindo(a) ao BariPlus!");
            navigate('/');
        } catch (error) {
            toast.error(error.message || "Ocorreu um erro ao salvar os seus dados.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="form-step active">
                        <h2>Primeiramente, já realizou a cirurgia bariátrica?</h2>
                        <div className="radio-group">
                            <label className={formData.fezCirurgia === 'sim' ? 'active' : ''}>
                                <input type="radio" name="fezCirurgia" value="sim" checked={formData.fezCirurgia === 'sim'} onChange={handleInputChange} />
                                Sim, já fiz
                            </label>
                            <label className={formData.fezCirurgia === 'nao' ? 'active' : ''}>
                                <input type="radio" name="fezCirurgia" value="nao" checked={formData.fezCirurgia === 'nao'} onChange={handleInputChange} />
                                Não, estou a preparar-me
                            </label>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="form-step active">
                        <h2>Conte-nos um pouco sobre a sua jornada.</h2>
                        <p>Estes dados são essenciais para acompanhar a sua evolução.</p>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Data da Cirurgia (ou prevista)</label>
                                <input type="date" name="dataCirurgia" value={formData.dataCirurgia} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Sua Altura (cm)</label>
                                <input type="number" name="altura" placeholder="Ex: 175" value={formData.altura} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Peso Inicial (kg)</label>
                                <input type="number" step="0.1" name="pesoInicial" placeholder="Ex: 120.5" value={formData.pesoInicial} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Sua Meta de Peso (kg)</label>
                                <input type="number" step="0.1" name="metaPeso" placeholder="Ex: 75" value={formData.metaPeso} onChange={handleInputChange} required />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="form-step active">
                        <h2>Consentimento de Dados de Saúde</h2>
                        <p>Para usar o BariPlus, precisamos da sua permissão para processar os dados de saúde que você insere (peso, medidas, datas, etc.), conforme a LGPD.</p>
                        <div className="consent-box">
                            <label>
                                <input type="checkbox" name="consentimentoDados" checked={formData.consentimentoDados} onChange={handleInputChange} />
                                <span>
                                    Eu entendo que estou a fornecer dados de saúde e consinto com o seu armazenamento e processamento para o funcionamento do aplicativo. Eu li e concordo com a <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.
                                </span>
                            </label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" />
                    <h3>Falta pouco para começar!</h3>
                </div>
                
                <div className="progress-bar">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}><span>Cirurgia</span></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}><span>Detalhes</span></div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}><span>Permissão</span></div>
                </div>

                <form onSubmit={handleSubmit} className="onboarding-form">
                    {renderStep()}
                    <div className="onboarding-navigation">
                        {step > 1 && <button type="button" className="secondary-btn" onClick={prevStep}>Voltar</button>}
                        {step < 3 && <button type="button" className="primary-btn" onClick={nextStep}>Avançar</button>}
                        {step === 3 && 
                            <button type="submit" className="primary-btn" disabled={isLoading || !formData.consentimentoDados}>
                                {isLoading ? 'A finalizar...' : 'Concluir e Começar a Usar'}
                            </button>
                        }
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;