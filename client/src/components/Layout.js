import React from 'react';

// Versão de teste super simples do Layout
const Layout = ({ children }) => {
  console.log("A renderizar o Layout de TESTE.");
  return (
    <div style={{ border: '3px solid blue', padding: '20px', margin: '20px' }}>
      <h2 style={{color: 'blue'}}>Invólucro do Layout de Teste</h2>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;