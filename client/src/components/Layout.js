import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

// ✅ CORREÇÃO 1: O componente agora recebe 'usuario' como uma "propriedade"
const Layout = ({ children, usuario }) => {
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
          <NavLink to="/perfil">Meu Perfil</NavLink>

          {/* ✅ CORREÇÃO 2: O link agora só aparece se o usuário for um afiliado */}
          {usuario && usuario.role === 'affiliate' && (
            <NavLink to="/portal-afiliado" className="affiliate-link">
              Portal do Afiliado
            </NavLink>
          )}
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