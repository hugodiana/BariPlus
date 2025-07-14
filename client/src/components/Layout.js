import React, { useState } from 'react';
// NOVIDADE: Importando o NavLink de volta
import { NavLink } from 'react-router-dom';
import './Layout.css';
// A logo continua de fora por enquanto

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('bariplus_token');
    window.location.href = '/login';
  };

  return (
    <div className="layout-container">
      {!isSidebarOpen && (
        <button className="hamburger-btn" onClick={toggleSidebar}>&#9776;</button>
      )}
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-placeholder">BariPlus Logo Aqui</div>
          <button className="sidebar-close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          {/* NOVIDADE: Usando o NavLink real com as rotas corretas */}
          <NavLink to="/" end>Painel</NavLink>
          <NavLink to="/checklist">Checklist</NavLink>
          <NavLink to="/progresso">Meu Progresso</NavLink>
          <NavLink to="/consultas">Minhas Consultas</NavLink>
          <NavLink to="/medicacao">Medicação</NavLink>
        </nav>
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;