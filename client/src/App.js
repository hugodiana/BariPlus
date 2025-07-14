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
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

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