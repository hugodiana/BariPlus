import React, 'useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onMessage } from "firebase/messaging";
import { messaging } from './firebase';

// ... (todas as suas outras importações de páginas)

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect para autenticação (continua igual)
  useEffect(() => {
    const token = localStorage.getItem('bariplus_token');
    const apiUrl = process.env.REACT_APP_API_URL;
    if (token) {
      fetch(`${apiUrl}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem('bariplus_token');
          throw new Error('Sessão inválida');
        }
        return res.json();
      })
      .then(dadosCompletos => setUsuario(dadosCompletos))
      .catch(error => {
        console.error(error);
        setUsuario(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ NOVIDADE: useEffect para ouvir por notificações com o app aberto
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      onMessage(messaging, (payload) => {
        console.log('Notificação recebida em primeiro plano: ', payload);
        toast.info(<div><strong>{payload.notification.title}</strong><br/>{payload.notification.body}</div>);
      });
    }
  }, []);


  const AppRoutes = () => {
    return (
      <Layout usuario={usuario}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/progresso" element={<ProgressoPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/medicacao" element={<MedicationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/diario-alimentar" element={<FoodDiaryPage />} />
          <Route path="/portal-afiliado" element={<AffiliatePortalPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    );
  };
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Router>
        <Routes>
          {!usuario ? (
            <>
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password/:userId/:token" element={<ResetPasswordPage />} />
              <Route path="*" element={<Navigate to="/landing" />} />
            </>
          ) : (
            <>
              <Route path="/planos" element={usuario.pagamentoEfetuado ? <Navigate to="/" /> : <PricingPage />} />
              <Route path="/bem-vindo" element={usuario.onboardingCompleto ? <Navigate to="/" /> : <OnboardingPage />} />
              <Route path="/pagamento-sucesso" element={<PaymentSuccessPage />} />
              <Route path="/pagamento-cancelado" element={<PaymentCancelPage />} />
              <Route path="/*" element={
                  !usuario.pagamentoEfetuado ? <Navigate to="/planos" />
                : !usuario.onboardingCompleto ? <Navigate to="/bem-vindo" />
                : <AppRoutes />
              }/>
            </>
          )}
        </Routes>
      </Router>
    </>
  );
}

export default App;