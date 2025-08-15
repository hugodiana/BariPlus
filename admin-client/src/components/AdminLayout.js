import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom'; // 1. Importa o useNavigate
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
        // Use a chave correta para o token do admin
        localStorage.removeItem('bariplus_admin_token'); 
        toast.info("Sessão encerrada com sucesso.");
        // 2. Redireciona para a página de login do admin
        navigate('/admin/login'); 
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src="/bariplus_logo.png" alt="BariPlus Logo" className="sidebar-logo" />
                    <span className="sidebar-title">Admin Panel</span>
                </div>
                <nav className="sidebar-nav">
                    {/* 3. Corrigidos os links para as rotas corretas do admin */}
                    <NavItem to="/admin/dashboard" icon="📊" text="Dashboard" />
                    <NavItem to="/admin/users" icon="👥" text="Usuários" />
                    <NavItem to="/admin/content" icon="📄" text="Conteúdo" />
                    {/* 4. Link de notificação agora usa o NavItem para consistência */}
                    <NavItem to="/admin/notifications" icon="🔔" text="Notificações" />
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