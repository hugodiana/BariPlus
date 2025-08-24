// client/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChartPie, faWeightScale, faListCheck, faFileLines, faUtensils, faBookMedical, 
    faDollarSign, faMedkit, faGlassWater, faTrophy, faComments, faRightFromBracket, 
    faUser, faDumbbell, faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import './Layout.css';

const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};

// Lista completa de links de navegação para o DESKTOP
const navLinks = [
    { to: "/", icon: faChartPie, text: "Dashboard" },
    { to: "/progresso", icon: faWeightScale, text: "Progresso" },
    { to: "/diario-alimentar", icon: faUtensils, text: "Diário" },
    { to: "/meu-plano", icon: faFileLines, text: "Meu Plano" },
    { to: "/hidratacao", icon: faGlassWater, text: "Hidratação" },
    { to: "/checklist", icon: faListCheck, text: "Checklist" },
    { to: "/medicacao", icon: faMedkit, text: "Medicação" },
    { to: "/consultas", icon: faBookMedical, text: "Consultas" },
    { to: "/exames", icon: faDumbbell, text: "Meus Exames" },
    { to: "/documentos", icon: faFileInvoice, text: "Meus Documentos" },
    { to: "/gastos", icon: faDollarSign, text: "Meus Gastos" },
    { to: "/conquistas", icon: faTrophy, text: "Conquistas" },
    { to: "/chat", icon: faComments, text: "Chat com Nutri" },
    { to: "/perfil", icon: faUser, text: "Perfil" },
];

const Sidebar = ({ user, handleLogout }) => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
            {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} end={link.to === "/"}>
                    <FontAwesomeIcon icon={link.icon} /> {link.text}
                </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
            <div className="user-info">
                <span className="user-name">{user?.nome}</span>
                <span className="user-email">{user?.email}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
                <FontAwesomeIcon icon={faRightFromBracket} /> Sair
            </button>
        </div>
    </aside>
);

const MobileBottomNav = () => (
    <nav className="mobile-bottom-nav">
        <ul className="mobile-nav-list">
            {[
                { to: "/", icon: faChartPie, text: "Dashboard" },
                { to: "/progresso", icon: faWeightScale, text: "Progresso" },
                { to: "/diario-alimentar", icon: faUtensils, text: "Diário" },
                { to: "/checklist", icon: faListCheck, text: "Checklist" },
                // ✅ CORREÇÃO: Alterado de "Perfil" para "Mais"
                { to: "/perfil", icon: faUser, text: "Mais" }, 
            ].map(link => (
                <li key={link.to} className="mobile-nav-item">
                    <NavLink to={link.to} end={link.to === "/"}>
                        <FontAwesomeIcon icon={link.icon} size="lg" />
                        <span>{link.text}</span>
                    </NavLink>
                </li>
            ))}
        </ul>
    </nav>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const windowWidth = useWindowWidth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout-container">
            {windowWidth > 768 ? (
                <Sidebar user={user} handleLogout={handleLogout} />
            ) : (
                <MobileBottomNav />
            )}
            
            <main className="main-content">
                <Outlet context={{ user }} />
            </main>
        </div>
    );
};

export default Layout;