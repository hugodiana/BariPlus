import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Layout.css';

const Layout = ({ children, usuario }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Fecha a sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('bariplus_token');
    // Usando window.location.assign para melhor rastreamento
    window.location.assign('/login');
  };

  // Verifica se é mobile baseado no tamanho da tela
  const isMobile = window.innerWidth <= 768;

  return (
    <div className="layout-container">
      {/* Botão hamburguer apenas em mobile */}
      {isMobile && !isSidebarOpen && (
        <button 
          className="hamburger-btn" 
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          aria-expanded={isSidebarOpen}
        >
          &#9776;
        </button>
      )}

      {/* Overlay apenas em mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="overlay" 
          onClick={toggleSidebar}
          role="button"
          aria-label="Fechar menu"
          tabIndex={0}
        />
      )}

      <aside 
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        aria-hidden={!isSidebarOpen && isMobile}
      >
        <div className="sidebar-header">
          <img 
            src="/bariplus_logo.png" 
            alt="BariPlus Logo" 
            className="sidebar-logo" 
            width="150"
            height="50"
          />
          {isMobile && (
            <button 
              className="sidebar-close-btn" 
              onClick={toggleSidebar}
              aria-label="Fechar menu"
            >
              &times;
            </button>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Painel
          </NavLink>
          <NavLink to="/checklist" className={({ isActive }) => isActive ? 'active' : ''}>
            Checklist
          </NavLink>
          <NavLink to="/progresso" className={({ isActive }) => isActive ? 'active' : ''}>
            Meu Progresso
          </NavLink>
          <NavLink to="/consultas" className={({ isActive }) => isActive ? 'active' : ''}>
            Minhas Consultas
          </NavLink>
          <NavLink to="/gastos" className={({ isActive }) => isActive ? 'active' : ''}>
            Controle de Gastos
          </NavLink>
          
          <NavLink to="/diario-alimentar" className={({ isActive }) => isActive ? 'active' : ''}>
            Diário Alimentar
          </NavLink>
          <NavLink to="/medicacao" className={({ isActive }) => isActive ? 'active' : ''}>
            Medicação
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => isActive ? 'active' : ''}>
            Meu Perfil
          </NavLink>
          <NavLink to="/seja-afiliado">Seja um Afiliado</NavLink>

             
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

      <main 
        className="main-content" 
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  usuario: PropTypes.shape({
    nome: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.oneOf(['user', 'affiliate', 'admin'])
  })
};

export default Layout;