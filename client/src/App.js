import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';
import MedicationPage from './pages/MedicationPage';

function App() {
  const [usuario, setUsuario] = useState(null);
  // A variável mais importante para resolver o nosso bug
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;

    if (token) {
      fetch(`${apiUrl}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida ou expirada');
        }
        return res.json();
      })
      .then(dadosCompletos => {
        setUsuario(dadosCompletos);
      })
      .catch(error => {
        console.error(error);
        setUsuario(null);
      })
      .finally(() => {
        // Independentemente do resultado, o carregamento termina
        setLoading(false);
      });
    } else {
      // Se não há token, não há o que carregar
      setLoading(false);
    }
  }, []);

  // --- A CORREÇÃO DEFINITIVA ESTÁ AQUI ---
  // Enquanto o 'loading' for verdadeiro, o app mostra esta div
  // e não tenta renderizar as rotas. Isto previne o redirecionamento.
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>A carregar...</div>;
  }

  // Só depois de 'loading' ser falso é que o código abaixo é executado
  return (
    <Router>
      <Routes>
        <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
        <Route path="/*" element={
          !usuario ? ( <Navigate to="/login" /> ) 
          : !usuario.onboardingCompleto ? ( <Navigate to="/bem-vindo" /> ) 
          : (
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/progresso" element={<ProgressoPage />} />
                <Route path="/checklist" element={<ChecklistPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/medicacao" element={<MedicationPage />} />
              </Routes>
            </Layout>
          )
        }/>
      </Routes>
    </Router>
  );
}

export default App;