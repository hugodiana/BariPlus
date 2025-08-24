// bariplus-nutri/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTachometerAlt, faUsers, faAppleAlt, faBook, faCalendarAlt, faCreditCard, faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import './Layout.css';

// Hook customizado para monitorizar a largura da janela
const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};

const navLinks = [
    { to: "/", icon: faTachometerAlt, text: "Dashboard" },
    { to: "/pacientes", icon: faUsers, text: "Meus Pacientes" },
    { to: "/meus-alimentos", icon: faAppleAlt, text: "Meus Alimentos" },
    { to: "/minhas-receitas", icon: faBook, text: "Minhas Receitas" },
    { to: "/agenda", icon: faCalendarAlt, text: "Agenda" },
    { to: "/assinatura", icon: faCreditCard, text: "Minha Assinatura" },
];

const Layout = ({ nutricionista }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const windowWidth = useWindowWidth();

    const handleLogout = () => {
        localStorage.removeItem('nutri_token');
        localStorage.removeItem('nutri_data');
        navigate('/login');
    };

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const handleLinkClick = () => {
        if (windowWidth <= 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="layout-container">
            {/* O botão hambúrguer é renderizado apenas em telas pequenas */}
            {windowWidth <= 768 && (
                <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">
                    ☰
                </button>
            )}

            {/* O overlay só existe no DOM quando o menu está aberto em telas pequenas */}
            {isSidebarOpen && windowWidth <= 768 && (
                <div className="overlay" onClick={toggleSidebar}></div>
            )}
            
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    {navLinks.map(link => (
                        <NavLink key={link.to} to={link.to} end={link.to === "/"} onClick={handleLinkClick}>
                            <FontAwesomeIcon icon={link.icon} /> {link.text}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-name">{nutricionista?.nome}</span>
                        <span className="user-email">{nutricionista?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <FontAwesomeIcon icon={faSignOutAlt} /> Sair
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;