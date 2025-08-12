// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

// Componente para o item de navegação com ícone
const NavItem = ({ to, icon, text, onClick }) => (
    <NavLink to={to} end onClick={onClick}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
    </NavLink>
);

const Layout = ({ children, usuario }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
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

    const handleLinkClick = () => {
        if (windowWidth <= 768) {
            toggleSidebar();
        }
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
                    {/* ✅ NOVIDADE: Links com ícones */}
                    <NavItem to="/" icon="🏠" text="Painel" onClick={handleLinkClick} />
                    <NavItem to="/progresso" icon="📊" text="Meu Progresso" onClick={handleLinkClick} />
                    <NavItem to="/diario-alimentar" icon="🥗" text="Diário Alimentar" onClick={handleLinkClick} />
                    <NavItem to="/checklist" icon="✅" text="Checklist" onClick={handleLinkClick} />
                    <NavItem to="/medicacao" icon="💊" text="Medicação" onClick={handleLinkClick} />
                    <NavItem to="/consultas" icon="🗓️" text="Consultas" onClick={handleLinkClick} />
                    <NavItem to="/exames" icon="⚕️" text="Meus Exames" onClick={handleLinkClick} />
                    <NavItem to="/gastos" icon="💳" text="Meus Gastos" onClick={handleLinkClick} />
                    <NavItem to="/conquistas" icon="🏆" text="Conquistas" onClick={handleLinkClick} />
                    <NavItem to="/artigos" icon="📚" text="Artigos e Dicas" onClick={handleLinkClick} />
                    <NavItem to="/perfil" icon="👤" text="Meu Perfil" onClick={handleLinkClick} />
                    <NavItem to="/ganhe-renda-extra" icon="💰" text="Ganhe Renda Extra" onClick={handleLinkClick} />
                </nav>

                <div className="sidebar-footer">
                    {usuario && (
                        <div className="user-info">
                            <span className="user-name">{usuario.nome} {usuario.sobrenome}</span>
                            <span className="user-email">{usuario.email}</span>
                        </div>
                    )}
                    <button onClick={handleLogout} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Sair</span>
                    </button>
                </div>
            </aside>
            
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;