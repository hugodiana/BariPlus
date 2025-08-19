import React, { useState, useEffect } from 'react';
// ✅ 1. Importar Outlet e useNavigate
import { NavLink, Outlet, useNavigate } from 'react-router-dom'; 
import './Layout.css';
import { toast } from 'react-toastify';

const NavItem = ({ to, icon, text, onClick }) => (
    <NavLink to={to} end onClick={onClick}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
    </NavLink>
);

const Layout = ({ usuario }) => {
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
        if (document.activeElement) document.activeElement.blur();
    };

    const handleLinkClick = () => {
        if (windowWidth <= 768) {
            toggleSidebar();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('bariplus_token');
        toast.info("Sessão encerrada.");
        // Redireciona para a landing page após o logout
        navigate('/landing'); 
    };

    return (
        <div className="layout-container">
            {windowWidth <= 768 && !isSidebarOpen && (
                <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">
                    {/* Substituímos o caractere por um SVG para melhor acessibilidade */}
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        aria-hidden="true" /* O ícone é decorativo, o aria-label já descreve a ação */
                    >
                        <title>Menu</title>
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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
                    <NavItem to="/" icon="🏠" text="Painel" onClick={handleLinkClick} />
                    <NavItem to="/progresso" icon="📊" text="Meu Progresso" onClick={handleLinkClick} />
                    <NavItem to="/plano-alimentar" icon="🍎" text="Plano Alimentar" onClick={handleLinkClick} />
                    <NavItem to="/diario-alimentar" icon="🥗" text="Diário Alimentar" onClick={handleLinkClick} />
                    <NavItem to="/hidratacao" icon="💧" text="Hidratação" onClick={handleLinkClick} />
                    <NavItem to="/checklist" icon="✅" text="Checklist" onClick={handleLinkClick} />
                    <NavItem to="/medicacao" icon="💊" text="Medicação" onClick={handleLinkClick} />
                    <NavItem to="/consultas" icon="🗓️" text="Consultas" onClick={handleLinkClick} />
                    <NavItem to="/exames" icon="⚕️" text="Meus Exames" onClick={handleLinkClick} />
                    <NavItem to="/gastos" icon="💳" text="Meus Gastos" onClick={handleLinkClick} />
                    <NavItem to="/conquistas" icon="🏆" text="Conquistas" onClick={handleLinkClick} />
                    <NavItem to="/artigos" icon="📚" text="Artigos e Dicas" onClick={handleLinkClick} />
                    <NavItem to="/relatorios" icon="🔗" text="Partilhar Relatórios" onClick={handleLinkClick} />
                    <NavItem to="/perfil" icon="👤" text="Meu Perfil" onClick={handleLinkClick} />
                    <NavItem to="/ganhe-renda-extra" icon="💰" text="Ganhe Renda Extra" onClick={handleLinkClick} />
                </nav>

                <div className="sidebar-footer">
                    {usuario && (
                        <div className="user-info">
                            {/* NOVO ELEMENTO DE IMAGEM */}
                            <img 
                                src={usuario.fotoPerfilUrl || '/placeholder-avatar.png'} 
                                alt="Foto de Perfil" 
                                className="sidebar-avatar" 
                            />
                            <div className="user-details">
                                <span className="user-name">{usuario.nome} {usuario.sobrenome}</span>
                                <span className="user-email">{usuario.email}</span>
                            </div>
                        </div>
                    )}
                        <button onClick={handleLogout} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Sair</span>
                    </button>
                </div>
            </aside>
            
            <main className="main-content">
                {/* ✅ 2. Substituir {children} por <Outlet /> */}
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;