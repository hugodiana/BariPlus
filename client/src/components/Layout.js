import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';
import logo from '../assets/bariplus_logo.png'; 

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      {/* NOVIDADE: O botão hambúrguer agora só aparece se a sidebar estiver FECHADA */}
      {!isSidebarOpen && (
        <button className="hamburger-btn" onClick={toggleSidebar}>
          &#9776;
        </button>
      )}

      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="BariPlus Logo" className="sidebar-logo" />
          
          {/* NOVIDADE: Botão de fechar que só aparece no mobile */}
          <button className="sidebar-close-btn" onClick={toggleSidebar}>
            &times; {/* Este é o código do ícone "X" */}
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Painel</NavLink> 
          <NavLink to="/checklist">Checklist</NavLink> 
          <NavLink to="/consultas">Consultas</NavLink>
          <NavLink to="/progresso">Meu Progresso</NavLink>
          <NavLink to="/logout">Sair</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;