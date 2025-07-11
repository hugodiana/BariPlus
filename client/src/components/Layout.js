import React from 'react';
import './Layout.css';
import logo from '../assets/bariplus_logo.png';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <header className="navbar">
        <img src={logo} alt="BariPlus Logo" className="navbar-logo" />
        <nav>
          <a href="/">Checklist</a>
          <a href="/">Consultas</a>
          <a href="/">Meu Progresso</a>
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;