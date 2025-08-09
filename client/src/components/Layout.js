import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, usuario }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Fecha o sidebar automaticamente se a tela for maior que 768px
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      {windowWidth <= 768 && !isSidebarOpen && (
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">
          &#9776;
        </button>
      )}

      {isSidebarOpen && windowWidth <= 768 && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
          {windowWidth <= 768 && (
            <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Fechar menu">
              &times;
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end onClick={() => windowWidth <= 768 && toggleSidebar()}>Painel</NavLink>
          <NavLink to="/checklist" onClick={() => windowWidth <= 768 && toggleSidebar()}>Checklist</NavLink>
          <NavLink to="/progresso" onClick={() => windowWidth <= 768 && toggleSidebar()}>Meu Progresso</NavLink>
          <NavLink to="/consultas" onClick={() => windowWidth <= 768 && toggleSidebar()}>Minhas Consultas</NavLink>
          <NavLink to="/diario-alimentar" onClick={() => windowWidth <= 768 && toggleSidebar()}>Diário Alimentar</NavLink>
          <NavLink to="/medicacao" onClick={() => windowWidth <= 768 && toggleSidebar()}>Medicação</NavLink>
          <NavLink to="/gastos" onClick={() => windowWidth <= 768 && toggleSidebar()}>Meus Gastos</NavLink>
          <NavLink to="/conquistas" onClick={() => windowWidth <= 768 && toggleSidebar()}>Minhas Conquistas</NavLink>
          <NavLink to="/exames" onClick={() => windowWidth <= 768 && toggleSidebar()}>Meus Exames</NavLink>
          <NavLink to="/artigos" onClick={() => windowWidth <= 768 && toggleSidebar()}>Artigos e Dicas</NavLink>
          <NavLink to="/perfil" onClick={() => windowWidth <= 768 && toggleSidebar()}>Meu Perfil</NavLink>
          <NavLink to="/ganhe-renda-extra" onClick={() => windowWidth <= 768 && toggleSidebar()} className="affiliate-link">
            Ganhe Renda Extra
          </NavLink>
        </nav>

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