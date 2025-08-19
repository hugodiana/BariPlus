// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../utils/api';
import './Layout.css';

const Layout = ({ nutricionista }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const windowWidth = useWindowWidth();

    const handleLogout = () => {
        setAuthToken(null);
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
            {windowWidth <= 768 && (
                <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">
                    ☰
                </button>
            )}

            {isSidebarOpen && windowWidth <= 768 && (
                <div className="overlay" onClick={toggleSidebar}></div>
            )}
            
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end onClick={handleLinkClick}>Dashboard</NavLink>
                    <NavLink to="/pacientes" onClick={handleLinkClick}>Meus Pacientes</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <span className="user-name">{nutricionista?.nome}</span>
                        <span className="user-email">{nutricionista?.email}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Sair</button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

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

export default Layout;