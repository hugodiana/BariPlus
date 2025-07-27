import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ handleLogout, usuario }) => {
    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h3>BariPlus Admin</h3>
                    {usuario && <small>{usuario.email}</small>}
                </div>
                <nav>
                    <NavLink to="/dashboard">Dashboard</NavLink>
                    <NavLink to="/users">Usuários</NavLink>
                    <NavLink to="/affiliates">Afiliados</NavLink>
                </nav>
                <button onClick={handleLogout} className="admin-logout-btn">Sair</button>
            </aside>
            <main className="admin-main-content">
                <Outlet />
            </main>
        </div>
    );
};
export default AdminLayout;