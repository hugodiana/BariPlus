import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminLayout.css';

// Componente auxiliar para os links da navegação com ícones
const NavItem = ({ to, icon, text }) => (
    <NavLink to={to} end>
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
    </NavLink>
);

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('bariplus_admin_token');
        toast.info("Sessão encerrada com sucesso.");
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                    <span className="sidebar-title">Admin Panel</span>
                </div>
                <nav className="sidebar-nav">
                    {/* ✅ CORREÇÃO: Caminhos das rotas atualizados para serem absolutos */}
                    <NavItem to="/dashboard" icon="📊" text="Dashboard" />
                    <NavItem to="/users" icon="👥" text="Usuários" />
                    <NavItem to="/content" icon="📄" text="Conteúdo" />
                    <NavItem to="/notifications" icon="🔔" text="Notificações" />
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Sair</span>
                    </button>
                </div>
            </aside>
            <main className="admin-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;