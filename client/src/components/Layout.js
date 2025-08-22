// client/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom'; 
import './Layout.css';
import { toast } from 'react-toastify';
// A importação 'setAuthToken' foi removida.

const NavItem = ({ to, icon, text, onClick, end = false }) => (
    // ...código igual
    <NavLink to={to} end={end} onClick={onClick}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
    </NavLink>
);

const Layout = ({ usuario, onLogout }) => {
    // ...código igual
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();

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
    };

    const handleLinkClick = () => {
        if (windowWidth <= 768) {
            toggleSidebar();
        }
    };

    const handleLogout = () => {
        onLogout();
        toast.info("Sessão encerrada.");
        navigate('/landing'); 
    };

    return (
        <div className="layout-container">
            {windowWidth <= 768 && !isSidebarOpen && (
                <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">&#9776;</button>
            )}

            {isSidebarOpen && windowWidth <= 768 && (
                <div className="overlay" onClick={toggleSidebar}></div>
            )}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                    {windowWidth <= 768 && (
                        <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Fechar menu">&times;</button>
                    )}
                </div>
                
                <nav className="sidebar-nav">
                    <NavItem to="/" icon="🏠" text="Painel" onClick={handleLinkClick} end={true} />
                    {usuario?.nutricionistaId && (
                        <>
                            <NavItem to="/meu-plano" icon="🍎" text="Plano Alimentar" onClick={handleLinkClick} />
                            <NavItem to="/chat" icon="💬" text="Chat com Nutri" onClick={handleLinkClick} />
                            <NavLink to="/documentos" onClick={handleLinkClick}>Meus Documentos</NavLink>
                        </>
                    )}
                    <NavItem to="/progresso" icon="📊" text="Meu Progresso" onClick={handleLinkClick} />
                    <NavItem to="/diario" icon="🥗" text="Diário Alimentar" onClick={handleLinkClick} />
                    <NavItem to="/hidratacao" icon="💧" text="Hidratação" onClick={handleLinkClick} />
                    <NavItem to="/checklist" icon="✅" text="Checklist" onClick={handleLinkClick} />
                    <NavItem to="/medicacao" icon="💊" text="Medicação" onClick={handleLinkClick} />
                    <NavItem to="/consultas" icon="🗓️" text="Consultas" onClick={handleLinkClick} />
                    <NavItem to="/exames" icon="⚕️" text="Meus Exames" onClick={handleLinkClick} />
                    <NavItem to="/gastos" icon="💳" text="Meus Gastos" onClick={handleLinkClick} />
                    <NavItem to="/conquistas" icon="🏆" text="Conquistas" onClick={handleLinkClick} />
                    <NavItem to="/artigos" icon="📚" text="Conteúdo" onClick={handleLinkClick} />
                    <NavItem to="/relatorios" icon="🔗" text="Relatórios" onClick={handleLinkClick} />
                    <NavItem to="/ganhe-renda-extra" icon="💰" text="Renda Extra" onClick={handleLinkClick} />
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/perfil" className="user-profile-link" onClick={handleLinkClick}>
                        <img src={usuario?.fotoPerfilUrl || 'https://i.imgur.com/V4RclNb.png'} alt="Perfil" className="user-avatar" />
                        <div className="user-info">
                            <span className="user-name">{usuario?.nome}</span>
                            <span className="user-email">{usuario?.email}</span>
                        </div>
                    </NavLink>
                    <button onClick={handleLogout} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Sair</span>
                    </button>
                </div>
            </aside>
            
            <main className="main-content">
                <Outlet context={{ user: usuario }} />
            </main>
        </div>
    );
};

export default Layout;