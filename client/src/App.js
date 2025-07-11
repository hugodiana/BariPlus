import React from 'react';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout'; // Precisamos do Layout para a parte logada

function App() {
  // Vamos simular o estado de login. No futuro, isso virá de um token.
  const isUserLoggedIn = false; 

  return (
    <>
      {isUserLoggedIn ? (
        <Layout>
          {/* Aqui dentro virá o conteúdo do app quando o usuário estiver logado,
              como o checklist, consultas, etc. */}
          <h2>Conteúdo do App Principal</h2>
        </Layout>
      ) : (
        <LoginPage />
      )}
    </>
  );
}

export default App;