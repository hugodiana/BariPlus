import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiLogOut } from 'react-icons/fi';
import './AdminLayout.css';

const AdminLayout = ({ handleLogout, usuario }) => {
    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="brand">
                        <h2>BariPlus</h2>
                        <span>Admin Panel</span>
                    </div>
                    {usuario && (
                        <div className="user-info">
                            <div className="user-avatar">
                                {usuario.nome?.charAt(0) || usuario.email.charAt(0)}
                            </div>
                            <div className="user-details">
                                <strong>{usuario.nome || 'Administrador'}</strong>
                                <small>{usuario.email}</small>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className="nav-item">
                        <FiHome className="nav-icon" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/users" className="nav-item">
                        <FiUsers className="nav-icon" />
                        <span>Usuários</span>
                    </NavLink>
                    <NavLink to="/affiliates" className="nav-item">
                        <FiDollarSign className="nav-icon" />
                        <span>Afiliados</span>
                    </NavLink>
                </nav>

                <button onClick={handleLogout} className="logout-btn">
                    <FiLogOut className="logout-icon" />
                    <span>Sair</span>
                </button>
            </aside>

            <main className="admin-content">
                <div className="content-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;