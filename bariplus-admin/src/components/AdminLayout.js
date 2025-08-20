// src/components/AdminLayout.js
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
// CORREÇÃO: useNavigate foi removido daqui
import './AdminLayout.css'; 

// A função onLogout agora é recebida como uma prop
const AdminLayout = ({ onLogout }) => {
    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>BariPlus Admin</h3>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end>Dashboard</NavLink>
                    <NavLink to="/pacientes">Pacientes</NavLink>
                    <NavLink to="/nutricionistas">Nutricionistas</NavLink>
                </nav>
                <div className="sidebar-footer">
                    {/* O botão agora chama a função recebida por prop */}
                    <button onClick={onLogout} className="logout-btn">Sair</button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;