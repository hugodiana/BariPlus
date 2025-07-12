import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const [fezCirurgia, setFezCirurgia] = useState(null);
  const [dataCirurgia, setDataCirurgia] = useState('');
  const [altura, setAltura] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('bariplus_token');
    if (!token) {
      setMessage('Erro de autenticação. Por favor, faça o login novamente.');
      return;
    }
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fezCirurgia, dataCirurgia, altura, pesoInicial })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Algo deu errado.');
      window.location.href = '/';
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="onboarding-container">
      <form className="onboarding-form" onSubmit={handleSubmit}>
        <h1>Quase lá!</h1>
        <p>Vamos personalizar sua experiência. Por favor, preencha os dados abaixo.</p>
        <div className="form-group">
          <label>Você já realizou a cirurgia bariátrica?</label>
          <div className="radio-group">
            <button type="button" className={fezCirurgia === 'sim' ? 'active' : ''} onClick={() => setFezCirurgia('sim')}>Sim</button>
            <button type="button" className={fezCirurgia === 'nao' ? 'active' : ''} onClick={() => setFezCirurgia('nao')}>Não</button>
          </div>
        </div>
        {fezCirurgia === 'sim' && (
          <div className="form-group">
            <label htmlFor="dataCirurgia">Data da Cirurgia</label>
            <input id="dataCirurgia" type="date" value={dataCirurgia} onChange={(e) => setDataCirurgia(e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="altura">Sua altura (em cm)</label>
          <input id="altura" type="number" placeholder="Ex: 175" value={altura} onChange={(e) => setAltura(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="peso">Seu peso inicial (em kg)</label>
          <input id="peso" type="number" placeholder="Ex: 120" value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} required />
        </div>
        <button type="submit">Salvar e Continuar</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};
export default OnboardingPage;