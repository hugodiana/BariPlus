import React, { useState } from 'react';
import './Layout.css';
// Note que NÃO estamos a importar a logo ou o NavLink ainda

const Layout = ({ children }) => {
  // Adicionando de volta a lógica de abrir/fechar
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    // A função de logout por enquanto não faz nada
    console.log("Clicou em Sair");
  };

  return (
    // Adicionando de volta toda a estrutura HTML/JSX
    <div className="layout-container">
      {!isSidebarOpen && (
        <button className="hamburger-btn" onClick={toggleSidebar}>&#9776;</button>
      )}
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {/* Deixamos um espaço para a logo por enquanto */}
          <div className="sidebar-logo-placeholder">BariPlus Logo Aqui</div>
          <button className="sidebar-close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          {/* Usando links normais <a> em vez de NavLink por enquanto */}
          <a href="#">Painel</a>
          <a href="#">Checklist</a>
          <a href="#">Meu Progresso</a>
          <a href="#">Minhas Consultas</a>
          <a href="#">Medicação</a>
        </nav>
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </aside>
      <main className="main-content">
        {children} {/* Aqui dentro virá o nosso Dashboard de teste com a borda vermelha */}
      </main>
    </div>
  );
};

export default Layout;