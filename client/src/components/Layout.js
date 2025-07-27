import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, usuario }) => {
  const [isSidebarOpen, setSidebarOpen] = in_useState(false);
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    if (document.activeElement) document.activeElement.blur();
  };

  const handleLogout = () => {
    localStorage.removeItem('bariplus_token');
    window.location.href = '/login';
  };

  return (
    <div className="layout-container">
      {!isSidebarOpen && ( <button className="hamburger-btn" onClick={toggleSidebar}>&#9776;</button> )}
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
          <button className="sidebar-close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Painel</NavLink>
          <NavLink to="/checklist">Checklist</NavLink>
          <NavLink to="/progresso">Meu Progresso</NavLink>
          <NavLink to="/consultas">Minhas Consultas</NavLink>
          <NavLink to="/diario-alimentar">Diário Alimentar</NavLink>
          <NavLink to="/medicacao">Medicação</NavLink>
          <NavLink to="/gastos">Meus Gastos</NavLink>
          <NavLink to="/perfil">Meu Perfil</NavLink>
          {usuario && usuario.role === 'affiliate' && (
            <NavLink to="/portal-afiliado" className="affiliate-link">Portal do Afiliado</NavLink>
          )}
          {usuario && usuario.role === 'user' && (
            <NavLink to="/seja-afiliado">Seja um Afiliado</NavLink>
          )}
        </nav>

        {/* ✅ NOVIDADE: Rodapé da Sidebar */}
        <div className="sidebar-footer">
          {usuario && (
            <div className="user-info">
              <span className="user-name">{usuario.nome} {usuario.sobrenome}</span>
              <span className="user-email">{usuario.email}</span>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">Sair</button>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;