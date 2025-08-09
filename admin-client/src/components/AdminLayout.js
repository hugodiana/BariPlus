import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const handleLogout = () => {
        localStorage.removeItem('bariplus_admin_token');
        window.location.href = '/login';
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                    <span className="sidebar-title">Admin</span>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end>Dashboard</NavLink>
                    <NavLink to="/users">Usuários</NavLink>
                    <NavLink to="/content">Conteúdo</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">Sair</button>
                </div>
            </aside>
            <main className="admin-main-content">
                {/* ✅ CORREÇÃO: O <Outlet /> é o responsável por renderizar as páginas */}
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;