import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../utils/api';
import './Layout.css'; // Vamos criar este ficheiro a seguir

const Layout = ({ nutricionista }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        setAuthToken(null);
        navigate('/login');
    };

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end>Dashboard</NavLink>
                    <NavLink to="/pacientes">Meus Pacientes</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <span>{nutricionista?.nome}</span>
                        <small>{nutricionista?.email}</small>
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

export default Layout;