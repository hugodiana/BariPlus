import React, { useState } from 'react';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const [fezCirurgia, setFezCirurgia] = useState(null); // 'sim' ou 'nao'
  // NOVIDADE: Novo estado para a segunda pergunta
  const [temDataMarcada, setTemDataMarcada] = useState(null); // 'sim' ou 'nao'

  const [dataCirurgia, setDataCirurgia] = useState('');
  const [altura, setAltura] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [message, setMessage] = useState('');

  const handleSetFezCirurgia = (valor) => {
    setFezCirurgia(valor);
    // Limpa a segunda pergunta se a primeira for alterada
    setTemDataMarcada(null); 
    setDataCirurgia(''); // Limpa a data para evitar inconsistências
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    try {
      await fetch(`${apiUrl}/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fezCirurgia, dataCirurgia, altura, pesoInicial })
      });
      window.location.href = '/';
    } catch (error) {
      setMessage(error.message || "Erro ao guardar os dados.");
    }
  };

  // Condição para mostrar o campo de data
  const mostrarCampoData = fezCirurgia === 'sim' || (fezCirurgia === 'nao' && temDataMarcada === 'sim');

  return (
    <div className="onboarding-container">
      <form className="onboarding-form" onSubmit={handleSubmit}>
        <h1>Quase lá!</h1>
        <p>Vamos personalizar a sua experiência. Por favor, preencha os dados abaixo.</p>

        <div className="form-group">
          <label>Você já realizou a cirurgia bariátrica?</label>
          <div className="radio-group">
            <button type="button" className={fezCirurgia === 'sim' ? 'active' : ''} onClick={() => handleSetFezCirurgia('sim')}>Sim</button>
            <button type="button" className={fezCirurgia === 'nao' ? 'active' : ''} onClick={() => handleSetFezCirurgia('nao')}>Não</button>
          </div>
        </div>

        {/* NOVIDADE: Pergunta que aparece se o utilizador responder "Não" */}
        {fezCirurgia === 'nao' && (
          <div className="form-group sub-question">
            <label>Já tem uma data marcada?</label>
            <div className="radio-group">
              <button type="button" className={temDataMarcada === 'sim' ? 'active' : ''} onClick={() => setTemDataMarcada('sim')}>Sim</button>
              <button type="button" className={temDataMarcada === 'nao' ? 'active' : ''} onClick={() => setTemDataMarcada('nao')}>Ainda Não</button>
            </div>
          </div>
        )}

        {/* NOVIDADE: Campo de data agora aparece em duas condições diferentes */}
        {mostrarCampoData && (
          <div className="form-group">
            <label htmlFor="dataCirurgia">Data da Cirurgia</label>
            <input id="dataCirurgia" type="date" value={dataCirurgia} onChange={(e) => setDataCirurgia(e.target.value)} required />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="altura">A sua altura (em cm)</label>
          <input id="altura" type="number" placeholder="Ex: 175" value={altura} onChange={(e) => setAltura(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="peso">O seu peso inicial (em kg)</label>
          <input id="peso" type="number" placeholder="Ex: 120" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} required />
        </div>

        <button type="submit">Salvar e Continuar</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default OnboardingPage;