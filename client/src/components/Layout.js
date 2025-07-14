import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';
import logo from '../assets/bariplus_logo.png'; 

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // NOVIDADE: Função para fazer logout
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
          <img src={logo} alt="BariPlus Logo" className="sidebar-logo" />
          <button className="sidebar-close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Painel</NavLink>
          <NavLink to="/checklist">Checklist</NavLink>
          <NavLink to="/progresso">O Meu Progresso</NavLink>
          <NavLink to="/consultas">As Minhas Consultas</NavLink>
          <NavLink to="/medicacao">Medicação</NavLink>
        </nav>
        {/* NOVIDADE: Botão de Sair agora tem uma classe e uma função */}
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;