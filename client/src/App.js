import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importando nossas páginas
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProgressoPage from './pages/ProgressoPage';
import ChecklistPage from './pages/ChecklistPage';
import ConsultasPage from './pages/ConsultasPage';

function App() {
  const [usuario, setUsuario] = useState(null);
  // NOVIDADE: Estado para controlar o carregamento inicial
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    
    if (token) {
      fetch('http://localhost:3001/api/me', { // Use a variável de ambiente aqui se já tiver trocado
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          // Se o token for inválido (ex: expirado), remove e encerra
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida');
        }
        return res.json();
      })
      .then(dadosCompletos => {
        setUsuario(dadosCompletos); // Define o usuário se o token for válido
      })
      .catch(error => {
        console.error(error);
        setUsuario(null); // Garante que o usuário seja nulo em caso de erro
      })
      .finally(() => {
        setLoading(false); // Termina o carregamento, independentemente do resultado
      });
    } else {
      // Se não há token, termina o carregamento imediatamente
      setLoading(false);
    }
  }, []);

  // --- A LÓGICA MAIS IMPORTANTE ---
  // Enquanto o app está verificando o token, mostra uma tela de carregamento.
  // Isso previne o redirecionamento prematuro para /login.
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Depois que o carregamento termina, o roteador pode tomar a decisão correta
  return (
    <Router>
      <Routes>
        <Route path="/login" element={!usuario ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/bem-vindo" element={usuario ? <OnboardingPage /> : <Navigate to="/login" />} />
        
        <Route path="/*" element={
          !usuario ? (
            <Navigate to="/login" />
          ) : !usuario.onboardingCompleto ? (
            <Navigate to="/bem-vindo" />
          ) : (
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/progresso" element={<ProgressoPage />} />
                <Route path="/checklist" element={<ChecklistPage />} />
                <Route path="/consultas" element={<ConsultasPage />} />
              </Routes>
            </Layout>
          )
        }/>
      </Routes>
    </Router>
  );
}

export default App;